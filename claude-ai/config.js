// Configuration management for Claude AI plugin
// Claude AI eklentisi icin yapilandirma yonetimi
//
// Reads API key and settings from ~/.berkide/config.json
// API anahtarini ve ayarlari ~/.berkide/config.json dosyasindan okur
// Never hardcode the API key — always read from user config.
// API anahtarini asla kodun icine yazma — her zaman kullanici yapilandirmasindan oku.

// Default configuration values
// Varsayilan yapilandirma degerleri
const defaults = {
    model: "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.0,
};

// In-memory config cache (overrides from commands)
// Bellekteki yapilandirma onbellegi (komutlardan gelen gecersiz kilmalar)
let configOverrides = {};

// Read the full config file from disk
// Diskteki yapilandirma dosyasini tamamen oku
function readConfigFile() {
    try {
        const home = editor.process.spawn("sh", ["-c", "echo $HOME"]);
        const homePath = (typeof home === "string" ? home : "").trim();
        if (!homePath) return {};

        const configPath = homePath + "/.berkide/config.json";
        const content = editor.fs.read(configPath);
        if (!content) return {};

        return JSON.parse(content);
    } catch (e) {
        // Config file missing or malformed — return empty
        // Yapilandirma dosyasi eksik veya bozuk — bos dondur
        return {};
    }
}

// Write a value back to the config file
// Yapilandirma dosyasina bir degeri geri yaz
function writeConfigFile(key, value) {
    try {
        const home = editor.process.spawn("sh", ["-c", "echo $HOME"]);
        const homePath = (typeof home === "string" ? home : "").trim();
        if (!homePath) return false;

        const configDir = homePath + "/.berkide";
        const configPath = configDir + "/config.json";

        // Ensure directory exists
        // Dizinin var oldugundan emin ol
        editor.process.spawn("mkdir", ["-p", configDir]);

        // Read existing config
        // Mevcut yapilandirmayi oku
        let config = {};
        try {
            const content = editor.fs.read(configPath);
            if (content) config = JSON.parse(content);
        } catch (e) { /* start fresh */ }

        // Set nested key (supports dot notation like "claude.apiKey")
        // Ic ice anahtari ayarla ("claude.apiKey" gibi nokta notasyonunu destekler)
        const parts = key.split(".");
        let obj = config;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]] || typeof obj[parts[i]] !== "object") {
                obj[parts[i]] = {};
            }
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;

        editor.fs.write(configPath, JSON.stringify(config, null, 2));
        return true;
    } catch (e) {
        console.log("[claude-ai] Failed to write config: " + e.message);
        return false;
    }
}

// Get the API key from config file
// Yapilandirma dosyasindan API anahtarini al
export function getApiKey() {
    // Check in-memory override first
    // Once bellekteki gecersiz kilmayi kontrol et
    if (configOverrides.apiKey) return configOverrides.apiKey;

    const config = readConfigFile();
    return config?.claude?.apiKey || "";
}

// Get the current model name
// Mevcut model adini al
export function getModel() {
    if (configOverrides.model) return configOverrides.model;

    const config = readConfigFile();
    return config?.claude?.model || defaults.model;
}

// Get the full resolved configuration
// Tamamen cozumlenmis yapilandirmayi al
export function getConfig() {
    const config = readConfigFile();
    const claudeConfig = config?.claude || {};

    return {
        apiKey: configOverrides.apiKey || claudeConfig.apiKey || "",
        model: configOverrides.model || claudeConfig.model || defaults.model,
        maxTokens: configOverrides.maxTokens || claudeConfig.maxTokens || defaults.maxTokens,
        temperature: configOverrides.temperature !== undefined
            ? configOverrides.temperature
            : (claudeConfig.temperature !== undefined ? claudeConfig.temperature : defaults.temperature),
    };
}

// Register configuration commands
// Yapilandirma komutlarini kaydet
export function registerConfigCommands() {

    // claude.setApiKey — store API key in config file
    // claude.setApiKey — API anahtarini yapilandirma dosyasina kaydet
    editor.commands.register("claude.setApiKey", (args) => {
        const key = args?.key;
        if (!key || typeof key !== "string") {
            return { error: "API key string required. Usage: claude.setApiKey({ key: 'sk-ant-...' })" };
        }

        // Validate format (Anthropic keys start with sk-ant-)
        // Formati dogrula (Anthropic anahtarlari sk-ant- ile baslar)
        if (!key.startsWith("sk-ant-")) {
            console.log("[claude-ai] Warning: API key does not start with 'sk-ant-' — may be invalid");
        }

        const ok = writeConfigFile("claude.apiKey", key);
        if (ok) {
            configOverrides.apiKey = key;
            editor.events.emit("claude.configChanged", JSON.stringify({ field: "apiKey" }));
            return { success: true, message: "API key saved to ~/.berkide/config.json" };
        }
        return { error: "Failed to save API key" };
    });

    // claude.getConfig — return current resolved config (API key masked)
    // claude.getConfig — mevcut cozumlenmis yapilandirmayi dondur (API anahtari maskeli)
    editor.commands.register("claude.getConfig", () => {
        const cfg = getConfig();
        return {
            apiKey: cfg.apiKey ? cfg.apiKey.substring(0, 10) + "..." : "(not set)",
            model: cfg.model,
            maxTokens: cfg.maxTokens,
            temperature: cfg.temperature,
        };
    });

    // claude.setModel — change the active model
    // claude.setModel — aktif modeli degistir
    editor.commands.register("claude.setModel", (args) => {
        const model = args?.model;
        if (!model || typeof model !== "string") {
            return { error: "Model name required. Usage: claude.setModel({ model: 'claude-sonnet-4-20250514' })" };
        }

        const ok = writeConfigFile("claude.model", model);
        if (ok) {
            configOverrides.model = model;
            editor.events.emit("claude.configChanged", JSON.stringify({ field: "model", value: model }));
            return { success: true, model };
        }
        return { error: "Failed to save model setting" };
    });

    // claude.setConfig — set arbitrary config fields
    // claude.setConfig — rastgele yapilandirma alanlarini ayarla
    editor.commands.register("claude.setConfig", (args) => {
        if (!args) return { error: "Config object required" };

        const results = {};
        if (args.maxTokens !== undefined) {
            const val = parseInt(args.maxTokens);
            if (isNaN(val) || val < 1 || val > 200000) {
                results.maxTokens = { error: "maxTokens must be 1-200000" };
            } else {
                writeConfigFile("claude.maxTokens", val);
                configOverrides.maxTokens = val;
                results.maxTokens = { success: true, value: val };
            }
        }
        if (args.temperature !== undefined) {
            const val = parseFloat(args.temperature);
            if (isNaN(val) || val < 0 || val > 1) {
                results.temperature = { error: "temperature must be 0.0-1.0" };
            } else {
                writeConfigFile("claude.temperature", val);
                configOverrides.temperature = val;
                results.temperature = { success: true, value: val };
            }
        }

        editor.events.emit("claude.configChanged", JSON.stringify({ fields: Object.keys(args) }));
        return results;
    });
}
