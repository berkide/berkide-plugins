// LSP Client Plugin — Language Server Protocol integration
// LSP Istemci Eklentisi — Language Server Protocol entegrasyonu
//
// Starts language servers per file type, handles LSP protocol (JSON-RPC 2.0).
// Dosya turune gore dil sunucularini baslatir, LSP protokolunu (JSON-RPC 2.0) isler.
// Provides: completion, diagnostics, hover, goto definition, find references.
// Saglar: tamamlama, tanilar, gezdirme, tanima gitme, referans bulma.

import { sendRequest, sendNotification, onNotification, handleData, reset } from './client.js';
import { serverConfigs, extToLanguage, detectLanguage, getServerConfig } from './config.js';
import { handleDiagnostics } from './diagnostics.js';
import { transformCompletions } from './completion.js';
import { transformHover } from './hover.js';
import { transformLocation, uriToPath, gotoLocation } from './definition.js';

// Active language server processes (language → process)
// Aktif dil sunucusu surecleri (dil → surec)
const servers = new Map();

// Path to URI conversion
// Yol → URI donusumu
function pathToUri(path) {
    return "file://" + encodeURIComponent(path).replace(/%2F/g, '/');
}

// Start a language server for a given language
// Belirli bir dil icin dil sunucusu baslat
function startServer(language) {
    if (servers.has(language)) return servers.get(language);

    const config = getServerConfig(language);
    if (!config) return null;

    console.log("[lsp] Starting server: " + config.command + " for " + language);

    const proc = editor.process.spawn(config.command, config.args);
    if (!proc) {
        console.log("[lsp] Failed to start: " + config.command);
        return null;
    }

    servers.set(language, { process: proc, config, initialized: false });

    // Handle stdout data from server
    // Sunucudan gelen stdout verisini isle
    // Note: This requires the process binding to support onData callbacks
    // Not: Bu, surec binding'inin onData geri cagrilarini desteklemesini gerektirir

    return servers.get(language);
}

// Send LSP initialize request
// LSP baslatma istegi gonder
async function initializeServer(server) {
    if (server.initialized) return;

    const result = await sendRequest(server.process, "initialize", {
        processId: null,
        capabilities: {
            textDocument: {
                completion: {
                    completionItem: {
                        snippetSupport: true,
                        documentationFormat: ["markdown", "plaintext"],
                    },
                },
                hover: { contentFormat: ["markdown", "plaintext"] },
                definition: { linkSupport: true },
                references: {},
                publishDiagnostics: { relatedInformation: true },
            },
        },
        rootUri: null,
    });

    sendNotification(server.process, "initialized", {});
    server.initialized = true;
    server.capabilities = result?.capabilities || {};

    console.log("[lsp] Server initialized: " + server.config.command);
    return result;
}

// Notify server about document open
// Sunucuya belge acilmasi hakkinda bildir
function didOpen(server, filePath, languageId, text) {
    sendNotification(server.process, "textDocument/didOpen", {
        textDocument: {
            uri: pathToUri(filePath),
            languageId,
            version: 1,
            text,
        },
    });
}

// Notify server about document change
// Sunucuya belge degisikligi hakkinda bildir
let docVersions = new Map();

function didChange(server, filePath, text) {
    const version = (docVersions.get(filePath) || 1) + 1;
    docVersions.set(filePath, version);

    sendNotification(server.process, "textDocument/didChange", {
        textDocument: { uri: pathToUri(filePath), version },
        contentChanges: [{ text }],
    });
}

// Register notification handler for diagnostics
// Tanilar icin bildirim isleyicisi kaydet
onNotification("textDocument/publishDiagnostics", handleDiagnostics);

// --- LSP Commands ---

// lsp.completion — Request completion at cursor position
// lsp.completion — Imlec konumunda tamamlama iste
editor.commands.register("lsp.completion", async (args) => {
    const line = args?.line ?? editor.cursor.getLine();
    const col = args?.col ?? editor.cursor.getCol();
    const filePath = args?.file || "";
    const language = detectLanguage(filePath);
    if (!language) return { items: [] };

    const server = servers.get(language);
    if (!server?.initialized) return { items: [] };

    const result = await sendRequest(server.process, "textDocument/completion", {
        textDocument: { uri: pathToUri(filePath) },
        position: { line, character: col },
    });

    return { items: transformCompletions(result) };
});

// lsp.hover — Request hover info at cursor position
// lsp.hover — Imlec konumunda gezdirme bilgisi iste
editor.commands.register("lsp.hover", async (args) => {
    const line = args?.line ?? editor.cursor.getLine();
    const col = args?.col ?? editor.cursor.getCol();
    const filePath = args?.file || "";
    const language = detectLanguage(filePath);
    if (!language) return null;

    const server = servers.get(language);
    if (!server?.initialized) return null;

    const result = await sendRequest(server.process, "textDocument/hover", {
        textDocument: { uri: pathToUri(filePath) },
        position: { line, character: col },
    });

    return transformHover(result);
});

// lsp.definition — Go to definition
// lsp.definition — Tanima git
editor.commands.register("lsp.definition", async (args) => {
    const line = args?.line ?? editor.cursor.getLine();
    const col = args?.col ?? editor.cursor.getCol();
    const filePath = args?.file || "";
    const language = detectLanguage(filePath);
    if (!language) return [];

    const server = servers.get(language);
    if (!server?.initialized) return [];

    const result = await sendRequest(server.process, "textDocument/definition", {
        textDocument: { uri: pathToUri(filePath) },
        position: { line, character: col },
    });

    const locations = transformLocation(result);
    if (locations.length === 1) gotoLocation(locations[0]);
    return locations;
});

// lsp.references — Find all references
// lsp.references — Tum referanslari bul
editor.commands.register("lsp.references", async (args) => {
    const line = args?.line ?? editor.cursor.getLine();
    const col = args?.col ?? editor.cursor.getCol();
    const filePath = args?.file || "";
    const language = detectLanguage(filePath);
    if (!language) return [];

    const server = servers.get(language);
    if (!server?.initialized) return [];

    const result = await sendRequest(server.process, "textDocument/references", {
        textDocument: { uri: pathToUri(filePath) },
        position: { line, character: col },
        context: { includeDeclaration: true },
    });

    return transformLocation(result);
});

// lsp.configure — Add or override a language server config
// lsp.configure — Bir dil sunucusu yapilandirmasi ekle veya gecersiz kil
editor.commands.register("lsp.configure", (args) => {
    if (!args?.language || !args?.command) {
        return { error: "Provide 'language' and 'command'" };
    }
    serverConfigs[args.language] = {
        command: args.command,
        args: args.args || [],
        rootPatterns: args.rootPatterns || [],
        languageId: args.languageId || args.language,
    };
    return { configured: args.language };
});

// lsp.stop — Stop a language server
// lsp.stop — Bir dil sunucusunu durdur
editor.commands.register("lsp.stop", (args) => {
    const language = args?.language;
    if (!language || !servers.has(language)) return { error: "No server for: " + language };
    // Note: process termination needs editor.process.kill() or similar
    servers.delete(language);
    return { stopped: language };
});

// lsp.status — List active language servers
// lsp.status — Aktif dil sunucularini listele
editor.commands.register("lsp.status", () => {
    const status = {};
    for (const [lang, server] of servers) {
        status[lang] = {
            command: server.config.command,
            initialized: server.initialized,
        };
    }
    return status;
});

console.log("[lsp] LSP client loaded — " + Object.keys(serverConfigs).length + " language configs");
