// Claude AI assistant plugin — inline completion, code explain, refactor, chat
// Claude AI asistan eklentisi — satir ici tamamlama, kod aciklama, yeniden duzenleme, sohbet
//
// Powered by Anthropic's Claude API (api.anthropic.com).
// Anthropic'in Claude API'si (api.anthropic.com) tarafindan desteklenir.
// API key must be configured in ~/.berkide/config.json (field: claude.apiKey).
// API anahtari ~/.berkide/config.json dosyasinda yapilandirilmalidir (alan: claude.apiKey).

import { registerConfigCommands, getApiKey, getConfig } from './config.js';
import { registerCompletionCommands } from './completion.js';
import { registerActionCommands } from './commands.js';

// Register all command groups
// Tum komut gruplarini kaydet
registerConfigCommands();
registerCompletionCommands();
registerActionCommands();

// Check if API key is configured and warn if not
// API anahtarinin yapilandirilip yapilandirilmadigini kontrol et ve degilse uyar
const apiKey = getApiKey();
if (!apiKey) {
    console.log("[claude-ai] WARNING: API key not configured.");
    console.log("[claude-ai] Set your key: editor.commands.exec('claude.setApiKey', { key: 'sk-ant-...' })");
    console.log("[claude-ai] Or add to ~/.berkide/config.json: { \"claude\": { \"apiKey\": \"sk-ant-...\" } }");
} else {
    const cfg = getConfig();
    console.log("[claude-ai] Ready — model: " + cfg.model);
}

// Emit plugin loaded event for UI clients
// UI istemcileri icin eklenti yuklendi olayini yay
editor.events.emit("claude.loaded", JSON.stringify({
    version: "1.0.0",
    commands: [
        "claude.complete", "claude.acceptCompletion", "claude.dismissCompletion",
        "claude.explain", "claude.refactor", "claude.generateTests",
        "claude.fix", "claude.doc", "claude.commitMessage",
        "claude.chat", "claude.chatClear", "claude.chatHistory", "claude.ask",
        "claude.setApiKey", "claude.getConfig", "claude.setModel", "claude.setConfig",
    ],
    attribution: "Powered by Claude — Anthropic",
}));

console.log("[claude-ai] Claude AI assistant loaded — Powered by Claude — Anthropic");
