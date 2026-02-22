// Anthropic API client — sends requests to api.anthropic.com
// Anthropic API istemcisi — api.anthropic.com adresine istekler gonderir
//
// Uses editor.process.spawn with curl since V8 does not have native fetch.
// V8'de yerel fetch olmadigindan editor.process.spawn ile curl kullanir.
// Handles errors, rate limits, and response parsing.
// Hatalari, hiz sinirlarini ve yanit ayristirmayi yonetir.

import { getApiKey, getModel, getConfig } from './config.js';

// API endpoint
// API uç noktasi
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

// Send a message to the Anthropic Messages API
// Anthropic Messages API'sine bir mesaj gonder
//
// @param {Array} messages - Array of {role, content} message objects
// @param {Object} options - Optional: model, maxTokens, temperature, system
// @returns {Object} - { success, content, usage, error, raw }
export function sendMessage(messages, options = {}) {
    // Validate API key
    // API anahtarini dogrula
    const apiKey = getApiKey();
    if (!apiKey) {
        return {
            success: false,
            error: "API key not configured. Run: claude.setApiKey({ key: 'sk-ant-...' })",
            code: "NO_API_KEY",
        };
    }

    // Build request body
    // Istek govdesini olustur
    const cfg = getConfig();
    const model = options.model || cfg.model;
    const maxTokens = options.maxTokens || cfg.maxTokens;
    const temperature = options.temperature !== undefined ? options.temperature : cfg.temperature;

    const body = {
        model,
        max_tokens: maxTokens,
        messages,
    };

    // Add system prompt if provided
    // Varsa sistem promptunu ekle
    if (options.system) {
        body.system = options.system;
    }

    // Set temperature (only if non-zero, as 0 is default)
    // Sicakligi ayarla (sadece sifir degilse, cunku 0 varsayilan)
    if (temperature > 0) {
        body.temperature = temperature;
    }

    // Serialize the request body to a temp file to avoid shell escaping issues
    // Kabuk kacis sorunlarindan kacinmak icin istek govdesini gecici dosyaya yaz
    const bodyJson = JSON.stringify(body);
    const tmpPath = "/tmp/berkide-claude-req-" + Date.now() + ".json";

    try {
        editor.fs.write(tmpPath, bodyJson);
    } catch (e) {
        return {
            success: false,
            error: "Failed to write request body: " + e.message,
            code: "WRITE_ERROR",
        };
    }

    // Execute curl via process.spawn
    // process.spawn ile curl calistir
    try {
        const result = editor.process.spawn("curl", [
            "-s",
            "-w", "\n%{http_code}",
            "-X", "POST",
            API_URL,
            "-H", "Content-Type: application/json",
            "-H", "x-api-key: " + apiKey,
            "-H", "anthropic-version: " + API_VERSION,
            "-d", "@" + tmpPath,
        ]);

        // Clean up temp file
        // Gecici dosyayi temizle
        try { editor.process.spawn("rm", ["-f", tmpPath]); } catch (e) { /* ignore */ }

        if (typeof result !== "string") {
            return {
                success: false,
                error: "curl command failed — no output received",
                code: "CURL_FAILED",
            };
        }

        // Parse response — last line is HTTP status code
        // Yaniti ayristir — son satir HTTP durum kodu
        const lines = result.trim().split("\n");
        const httpCode = parseInt(lines[lines.length - 1]);
        const responseBody = lines.slice(0, -1).join("\n");

        if (!responseBody) {
            return {
                success: false,
                error: "Empty response from API (HTTP " + httpCode + ")",
                code: "EMPTY_RESPONSE",
                httpCode,
            };
        }

        let parsed;
        try {
            parsed = JSON.parse(responseBody);
        } catch (e) {
            return {
                success: false,
                error: "Invalid JSON response: " + responseBody.substring(0, 200),
                code: "INVALID_JSON",
                httpCode,
            };
        }

        // Handle API errors
        // API hatalarini isle
        if (httpCode === 401) {
            return {
                success: false,
                error: "Invalid API key — check your key with claude.getConfig",
                code: "INVALID_KEY",
                httpCode,
            };
        }

        if (httpCode === 429) {
            const retryAfter = parsed?.error?.message || "Rate limited";
            return {
                success: false,
                error: "Rate limited — " + retryAfter,
                code: "RATE_LIMITED",
                httpCode,
            };
        }

        if (httpCode === 529) {
            return {
                success: false,
                error: "Anthropic API overloaded — try again later",
                code: "OVERLOADED",
                httpCode,
            };
        }

        if (httpCode >= 400) {
            return {
                success: false,
                error: parsed?.error?.message || "API error (HTTP " + httpCode + ")",
                code: "API_ERROR",
                httpCode,
                raw: parsed,
            };
        }

        // Success — extract content text
        // Basarili — icerik metnini cikar
        const contentBlocks = parsed.content || [];
        const textParts = contentBlocks
            .filter(b => b.type === "text")
            .map(b => b.text);
        const content = textParts.join("");

        return {
            success: true,
            content,
            model: parsed.model,
            stopReason: parsed.stop_reason,
            usage: parsed.usage || {},
            raw: parsed,
        };

    } catch (e) {
        // Clean up temp file on error
        // Hata durumunda gecici dosyayi temizle
        try { editor.process.spawn("rm", ["-f", tmpPath]); } catch (ex) { /* ignore */ }

        return {
            success: false,
            error: "Request failed: " + e.message,
            code: "REQUEST_FAILED",
        };
    }
}

// Send a streaming request (falls back to full response in V8 environment)
// Akis istegi gonder (V8 ortaminda tam yanita geri doner)
//
// Since editor.process.spawn is synchronous and returns the full output,
// true streaming is not possible. This function simulates streaming by
// emitting progress events as chunks of the response.
//
// editor.process.spawn senkron oldugu ve tam ciktiyi dondurdugu icin,
// gercek akis mumkun degildir. Bu fonksiyon, yanitin parcalari olarak
// ilerleme olaylari yayarak akisi simule eder.
export function sendStream(messages, options = {}) {
    // Send the full request
    // Tam istegi gonder
    const result = sendMessage(messages, options);

    if (!result.success) {
        editor.events.emit("claude.streamError", JSON.stringify(result));
        return result;
    }

    // Simulate streaming by emitting chunks of the response content
    // Yanit iceriginin parcalarini yayarak akisi simule et
    const content = result.content;
    const chunkSize = 80;
    let offset = 0;

    while (offset < content.length) {
        const chunk = content.substring(offset, offset + chunkSize);
        editor.events.emit("claude.streamChunk", JSON.stringify({
            chunk,
            offset,
            total: content.length,
            done: (offset + chunkSize) >= content.length,
        }));
        offset += chunkSize;
    }

    editor.events.emit("claude.streamDone", JSON.stringify({
        content,
        usage: result.usage,
        model: result.model,
    }));

    return result;
}
