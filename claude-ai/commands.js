// AI action commands — explain, refactor, tests, fix, doc, chat
// AI eylem komutlari — aciklama, yeniden duzenleme, testler, duzeltme, belgeleme, sohbet
//
// Each command sends context + selection to Claude and emits results via events.
// Her komut baglam + secimi Claude'a gonderir ve sonuclari olaylar uzerinden yayar.
// UI clients listen to events and display results (panel, floating window, etc).
// UI istemcileri olaylari dinler ve sonuclari gosterir (panel, kayan pencere, vb).

import { sendMessage, sendStream } from './api.js';
import { getCurrentContext, getProjectContext, truncateContext } from './context.js';

// Conversation history for chat mode
// Sohbet modu icin konusma gecmisi
let chatHistory = [];
const MAX_CHAT_HISTORY = 50;

// Helper: get selected text or prompt for it
// Yardimci: secili metni al veya iste
function getSelectionText(ctx) {
    if (ctx.selection && ctx.selection.text) {
        return ctx.selection.text;
    }
    return null;
}

// Helper: build code context string with file info
// Yardimci: dosya bilgisiyle kod baglam dizesi olustur
function buildCodeContext(ctx, maxChars) {
    let context = "";
    if (ctx.filePath) context += "File: " + ctx.filePath + "\n";
    context += "Language: " + ctx.language + "\n";
    context += "Cursor at line " + (ctx.cursorLine + 1) + ", column " + (ctx.cursorCol + 1) + "\n\n";

    if (ctx.bufferContent) {
        context += truncateContext(ctx.bufferContent, maxChars || 8000, ctx.cursorLine);
    }

    return context;
}

// Helper: emit result event and return result object
// Yardimci: sonuc olayini yay ve sonuc nesnesini dondur
function emitResult(eventName, result, extraData) {
    const payload = {
        success: result.success,
        content: result.content || "",
        error: result.error || "",
        usage: result.usage || {},
        ...extraData,
    };
    editor.events.emit(eventName, JSON.stringify(payload));
    return payload;
}

// Register all AI action commands
// Tum AI eylem komutlarini kaydet
export function registerActionCommands() {

    // claude.explain — explain selected code
    // claude.explain — secili kodu acikla
    editor.commands.register("claude.explain", (args) => {
        const ctx = getCurrentContext();
        const selection = getSelectionText(ctx);
        const code = selection || args?.code;

        if (!code) {
            return { error: "Select code to explain, or pass { code: '...' }" };
        }

        const codeContext = buildCodeContext(ctx, 4000);
        const systemPrompt =
            "You are an expert code explainer. Explain code clearly and concisely. " +
            "Use bullet points for key concepts. Mention any potential issues or edge cases.";

        const messages = [{
            role: "user",
            content: "Explain this code:\n\n```" + ctx.language + "\n" + code + "\n```\n\n" +
                     "Full file context:\n" + codeContext,
        }];

        const result = sendMessage(messages, { system: systemPrompt });
        return emitResult("claude.explainResult", result, { code });
    });

    // claude.refactor — suggest refactoring for selection
    // claude.refactor — secim icin yeniden duzenleme oner
    editor.commands.register("claude.refactor", (args) => {
        const ctx = getCurrentContext();
        const selection = getSelectionText(ctx);
        const code = selection || args?.code;
        const instruction = args?.instruction || "Improve this code";

        if (!code) {
            return { error: "Select code to refactor, or pass { code: '...' }" };
        }

        const codeContext = buildCodeContext(ctx, 4000);
        const systemPrompt =
            "You are an expert code refactoring assistant. " +
            "Provide the refactored code followed by a brief explanation of changes. " +
            "Output the code in a fenced code block. Maintain the same language and style.";

        const messages = [{
            role: "user",
            content: "Refactor this " + ctx.language + " code. " + instruction + ":\n\n" +
                     "```" + ctx.language + "\n" + code + "\n```\n\n" +
                     "Full file context:\n" + codeContext,
        }];

        const result = sendMessage(messages, { system: systemPrompt });
        return emitResult("claude.refactorResult", result, { code, instruction });
    });

    // claude.generateTests — generate tests for selected function
    // claude.generateTests — secili fonksiyon icin testler olustur
    editor.commands.register("claude.generateTests", (args) => {
        const ctx = getCurrentContext();
        const selection = getSelectionText(ctx);
        const code = selection || args?.code;
        const framework = args?.framework || "";

        if (!code) {
            return { error: "Select a function to generate tests for, or pass { code: '...' }" };
        }

        // Try to detect test framework from project context
        // Proje baglamindan test cercevesini algila
        const projCtx = getProjectContext();
        let detectedFramework = framework;
        if (!detectedFramework) {
            for (const imp of projCtx.imports) {
                if (imp.module.includes("jest") || imp.module.includes("@jest")) detectedFramework = "jest";
                else if (imp.module.includes("mocha")) detectedFramework = "mocha";
                else if (imp.module.includes("pytest")) detectedFramework = "pytest";
                else if (imp.module.includes("vitest")) detectedFramework = "vitest";
            }
        }

        const systemPrompt =
            "You are a test generation expert. Write comprehensive unit tests. " +
            "Include edge cases, error cases, and boundary conditions. " +
            "Output only the test code in a fenced code block.";

        let userPrompt = "Generate unit tests for this " + ctx.language + " code:\n\n" +
                         "```" + ctx.language + "\n" + code + "\n```";

        if (detectedFramework) {
            userPrompt += "\n\nUse the " + detectedFramework + " testing framework.";
        }

        const messages = [{ role: "user", content: userPrompt }];
        const result = sendMessage(messages, { system: systemPrompt });
        return emitResult("claude.generateTestsResult", result, { code, framework: detectedFramework });
    });

    // claude.fix — find bugs and suggest fixes
    // claude.fix — hatalari bul ve duzeltmeler oner
    editor.commands.register("claude.fix", (args) => {
        const ctx = getCurrentContext();
        const selection = getSelectionText(ctx);
        const code = selection || args?.code;
        const errorMessage = args?.error || "";

        if (!code) {
            return { error: "Select code to fix, or pass { code: '...' }" };
        }

        const codeContext = buildCodeContext(ctx, 4000);
        const systemPrompt =
            "You are a code debugging expert. Find bugs and issues in the code. " +
            "For each issue: describe the bug, explain why it's a problem, and provide the fix. " +
            "Output the fixed code in a fenced code block at the end.";

        let userPrompt = "Find bugs and fix this " + ctx.language + " code:\n\n" +
                         "```" + ctx.language + "\n" + code + "\n```";

        if (errorMessage) {
            userPrompt += "\n\nThe following error occurs:\n" + errorMessage;
        }

        userPrompt += "\n\nFull file context:\n" + codeContext;

        const messages = [{ role: "user", content: userPrompt }];
        const result = sendMessage(messages, { system: systemPrompt });
        return emitResult("claude.fixResult", result, { code, errorMessage });
    });

    // claude.doc — generate documentation/comments for code
    // claude.doc — kod icin belgeleme/yorumlar olustur
    editor.commands.register("claude.doc", (args) => {
        const ctx = getCurrentContext();
        const selection = getSelectionText(ctx);
        const code = selection || args?.code;
        const style = args?.style || "jsdoc";

        if (!code) {
            return { error: "Select code to document, or pass { code: '...' }" };
        }

        // Detect documentation style based on language
        // Dile gore belgeleme stilini algila
        let docStyle = style;
        if (style === "auto") {
            const langStyles = {
                javascript: "jsdoc", typescript: "tsdoc",
                python: "docstring", java: "javadoc",
                c: "doxygen", cpp: "doxygen",
                rust: "rustdoc", go: "godoc",
            };
            docStyle = langStyles[ctx.language] || "inline";
        }

        const systemPrompt =
            "You are a documentation expert. Generate clear, comprehensive documentation. " +
            "Use " + docStyle + " format. Include parameter descriptions, return values, " +
            "and usage examples where appropriate. Output only the documented code.";

        const messages = [{
            role: "user",
            content: "Add documentation to this " + ctx.language + " code using " + docStyle + " style:\n\n" +
                     "```" + ctx.language + "\n" + code + "\n```",
        }];

        const result = sendMessage(messages, { system: systemPrompt });
        return emitResult("claude.docResult", result, { code, style: docStyle });
    });

    // claude.commitMessage — generate a git commit message from staged diff
    // claude.commitMessage — sahnelenmis farktan bir git commit mesaji olustur
    editor.commands.register("claude.commitMessage", (args) => {
        // Get git diff of staged changes
        // Sahnelenmis degisikliklerin git farkini al
        let diff = "";
        try {
            const diffResult = editor.commands.exec("git.diffStaged");
            if (diffResult && diffResult.hunks) {
                // Reconstruct diff text from hunks
                // Hunk'lardan fark metnini yeniden olustur
                for (const hunk of diffResult.hunks) {
                    for (const change of hunk.changes) {
                        if (change.type === "added") diff += "+ " + change.text + "\n";
                        else if (change.type === "removed") diff += "- " + change.text + "\n";
                        else diff += "  " + change.text + "\n";
                    }
                }
            }
        } catch (e) {
            // Fallback: use git diff directly
            // Yedek: git diff'i dogrudan kullan
            try {
                diff = editor.process.spawn("git", ["diff", "--staged"]) || "";
            } catch (ex) {
                return { error: "Failed to get git diff: " + ex.message };
            }
        }

        if (!diff || !diff.trim()) {
            // Try unstaged diff if no staged changes
            // Sahnelenmis degisiklik yoksa sahnelenememis farki dene
            try {
                diff = editor.process.spawn("git", ["diff"]) || "";
            } catch (e) { /* ignore */ }
        }

        if (!diff || !diff.trim()) {
            return { error: "No changes detected — stage changes first with git add" };
        }

        const truncatedDiff = truncateContext(diff, 6000);

        const systemPrompt =
            "You are a git commit message expert. Write a conventional commit message. " +
            "Format: type(scope): description\\n\\nbody (optional). " +
            "Types: feat, fix, refactor, docs, test, chore, style, perf, ci, build. " +
            "Keep the first line under 72 characters. Be specific and descriptive.";

        const messages = [{
            role: "user",
            content: "Generate a commit message for these changes:\n\n" + truncatedDiff,
        }];

        const result = sendMessage(messages, {
            system: systemPrompt,
            maxTokens: 256,
            temperature: 0.2,
        });

        return emitResult("claude.commitMessageResult", result, {});
    });

    // claude.chat — send a message in chat mode (maintains conversation history)
    // claude.chat — sohbet modunda bir mesaj gonder (konusma gecmisini tutar)
    editor.commands.register("claude.chat", (args) => {
        const message = args?.message;
        if (!message || typeof message !== "string") {
            return { error: "Message required. Usage: claude.chat({ message: '...' })" };
        }

        const includeContext = args?.includeContext !== false;
        const ctx = getCurrentContext();

        // Build user message with optional code context
        // Istege bagli kod baglamiyla kullanici mesajini olustur
        let userContent = message;
        if (includeContext && ctx.bufferContent) {
            const codeContext = buildCodeContext(ctx, 4000);
            userContent += "\n\nCurrent file context:\n" + codeContext;

            // Add selection if available
            // Varsa secimi ekle
            const selection = getSelectionText(ctx);
            if (selection) {
                userContent += "\n\nSelected code:\n```" + ctx.language + "\n" + selection + "\n```";
            }
        }

        // Add to conversation history
        // Konusma gecmisine ekle
        chatHistory.push({ role: "user", content: userContent });

        // Trim history if too long
        // Gecmis cok uzunsa kirp
        if (chatHistory.length > MAX_CHAT_HISTORY) {
            chatHistory = chatHistory.slice(-MAX_CHAT_HISTORY);
        }

        const systemPrompt =
            "You are Claude, an AI assistant integrated into BerkIDE (a modern code editor). " +
            "You help developers write, understand, debug, and improve code. " +
            "Be concise but thorough. Use code blocks with language tags when showing code. " +
            "You have access to the user's current file and selection context.";

        const result = sendMessage(chatHistory, { system: systemPrompt });

        if (result.success) {
            // Add assistant response to history
            // Asistan yanitini gecmise ekle
            chatHistory.push({ role: "assistant", content: result.content });
        }

        return emitResult("claude.chatResult", result, { userMessage: message });
    });

    // claude.chatClear — clear conversation history
    // claude.chatClear — konusma gecmisini temizle
    editor.commands.register("claude.chatClear", () => {
        const count = chatHistory.length;
        chatHistory = [];
        editor.events.emit("claude.chatCleared", JSON.stringify({ messagesCleared: count }));
        return { success: true, messagesCleared: count };
    });

    // claude.chatHistory — get current conversation history (for UI display)
    // claude.chatHistory — mevcut konusma gecmisini al (UI goruntulemesi icin)
    editor.commands.register("claude.chatHistory", () => {
        return {
            messages: chatHistory.map(m => ({
                role: m.role,
                // Truncate long messages for the listing
                // Listeleme icin uzun mesajlari kirp
                preview: m.content.substring(0, 200) + (m.content.length > 200 ? "..." : ""),
            })),
            count: chatHistory.length,
        };
    });

    // claude.ask — quick one-shot question (no history, no context)
    // claude.ask — hizli tek seferlik soru (gecmis yok, baglam yok)
    editor.commands.register("claude.ask", (args) => {
        const question = args?.question || args?.message;
        if (!question) {
            return { error: "Question required. Usage: claude.ask({ question: '...' })" };
        }

        const messages = [{ role: "user", content: question }];
        const result = sendMessage(messages, {
            maxTokens: args?.maxTokens || 2048,
        });

        return emitResult("claude.askResult", result, { question });
    });
}
