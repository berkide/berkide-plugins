// Inline AI completion — ghost text suggestions powered by Claude
// Satir ici AI tamamlama — Claude tarafindan desteklenen hayalet metin onerileri
//
// Shows AI-generated code completions as virtual text (extmarks).
// AI tarafindan olusturulan kod tamamlamalarini sanal metin (extmark) olarak gosterir.
// Users can accept or dismiss suggestions with commands.
// Kullanicilar onerileri komutlarla kabul edebilir veya reddedebilir.

import { sendMessage } from './api.js';
import { getCurrentContext, getSurroundingLines, truncateContext } from './context.js';

// Extmark namespace for ghost text
// Hayalet metin icin extmark ad alani
const GHOST_NS = "claude-ghost";

// Current pending completion state
// Mevcut bekleyen tamamlama durumu
let pendingCompletion = null;

// Build the completion prompt from current buffer context
// Mevcut buffer baglamindan tamamlama istemini olustur
function buildCompletionPrompt(ctx) {
    const surrounding = getSurroundingLines(ctx.bufferContent, ctx.cursorLine, 40, 10);

    // Build a focused prompt for code completion
    // Kod tamamlama icin odaklanmis bir istem olustur
    let prompt = "";

    if (ctx.filePath) {
        prompt += "File: " + ctx.filePath + "\n";
    }
    prompt += "Language: " + ctx.language + "\n\n";

    // Provide context before cursor
    // Imlecten onceki baglami sagla
    if (surrounding.before) {
        prompt += surrounding.before + "\n";
    }

    // Current line up to cursor position
    // Imlec konumuna kadar mevcut satir
    const lineUpToCursor = surrounding.currentLine.substring(0, ctx.cursorCol);
    prompt += lineUpToCursor;

    return {
        prompt,
        lineUpToCursor,
        currentLine: surrounding.currentLine,
        afterContext: surrounding.after,
    };
}

// Request an inline completion from Claude
// Claude'dan bir satir ici tamamlama iste
export function requestCompletion() {
    const ctx = getCurrentContext();
    if (!ctx.bufferContent) {
        return { error: "No active buffer" };
    }

    const { prompt, lineUpToCursor, currentLine } = buildCompletionPrompt(ctx);

    // System prompt for completion mode
    // Tamamlama modu icin sistem istemi
    const systemPrompt =
        "You are an inline code completion engine. " +
        "Complete the code starting exactly where the cursor is. " +
        "Only output the completion text — no explanations, no markdown, no code fences. " +
        "Keep completions concise (1-5 lines). " +
        "Match the existing code style, indentation, and conventions.";

    const messages = [
        {
            role: "user",
            content: "Complete this code (continue from the last character):\n\n" + prompt,
        },
    ];

    // Send with low temperature for deterministic completions
    // Deterministik tamamlamalar icin dusuk sicaklikla gonder
    const result = sendMessage(messages, {
        system: systemPrompt,
        maxTokens: 256,
        temperature: 0.0,
    });

    if (!result.success) {
        editor.events.emit("claude.completionError", JSON.stringify(result));
        return result;
    }

    // Clean up the completion text
    // Tamamlama metnini temizle
    let completionText = result.content || "";

    // Remove markdown code fences if the model added them
    // Model eklediyse markdown kod citlerini kaldir
    completionText = completionText.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");

    // Remove leading whitespace that duplicates what's already on the line
    // Satirda zaten olan boslugu tekrarlayan bas boslugu kaldir
    if (completionText.startsWith(lineUpToCursor)) {
        completionText = completionText.substring(lineUpToCursor.length);
    }

    if (!completionText.trim()) {
        return { success: true, content: "", message: "No completion suggested" };
    }

    // Show as ghost text using extmarks
    // Extmark'lar kullanarak hayalet metin olarak goster
    showGhostText(completionText, ctx.cursorLine, ctx.cursorCol);

    return {
        success: true,
        content: completionText,
        line: ctx.cursorLine,
        col: ctx.cursorCol,
    };
}

// Display ghost text as virtual text extmarks
// Hayalet metni sanal metin extmark'lari olarak goster
function showGhostText(text, line, col) {
    // Clear any previous ghost text
    // Onceki hayalet metni temizle
    clearGhostText();

    const lines = text.split("\n");

    // First line: show as inline virtual text at cursor position
    // Ilk satir: imlec konumunda satir ici sanal metin olarak goster
    if (lines[0]) {
        const id = editor.extmarks.setWithVirtText(
            GHOST_NS, line, col, line, col,
            lines[0], "inline", "ghost", "completion", ""
        );

        pendingCompletion = {
            text,
            line,
            col,
            extmarkIds: [id],
        };
    }

    // Additional lines: show as EOL virtual text on subsequent lines
    // Ek satirlar: sonraki satirlarda EOL sanal metin olarak goster
    for (let i = 1; i < lines.length; i++) {
        if (lines[i]) {
            const id = editor.extmarks.setWithVirtText(
                GHOST_NS, line + i, 0, line + i, 0,
                lines[i], "overlay", "ghost", "completion", ""
            );
            if (pendingCompletion) {
                pendingCompletion.extmarkIds.push(id);
            }
        }
    }

    // Emit event for UI to style the ghost text
    // UI'nin hayalet metni biclendirmesi icin olay yay
    editor.events.emit("claude.completionShown", JSON.stringify({
        text,
        line,
        col,
        lineCount: lines.length,
    }));
}

// Clear ghost text extmarks
// Hayalet metin extmark'larini temizle
function clearGhostText() {
    editor.extmarks.clearNamespace(GHOST_NS);
    pendingCompletion = null;
}

// Accept the current completion — insert ghost text into the buffer
// Mevcut tamamlamayi kabul et — hayalet metni buffer'a ekle
export function acceptCompletion() {
    if (!pendingCompletion) {
        return { error: "No pending completion to accept" };
    }

    const { text, line, col } = pendingCompletion;

    // Clear ghost text first
    // Once hayalet metni temizle
    clearGhostText();

    // Insert the completion text at cursor position
    // Tamamlama metnini imlec konumuna ekle
    try {
        editor.commands.exec("insertText", { text, line, col });
    } catch (e) {
        // Fallback: try buffer-level insert
        // Yedek: buffer seviyesinde ekleme dene
        try {
            const state = editor.state.get();
            const bufId = state?.activeBuffer;
            if (bufId !== undefined) {
                editor.buffers.insert(bufId, line, col, text);
            }
        } catch (ex) {
            return { error: "Failed to insert completion: " + ex.message };
        }
    }

    editor.events.emit("claude.completionAccepted", JSON.stringify({ text, line, col }));

    return { success: true, inserted: text };
}

// Dismiss the current completion — remove ghost text
// Mevcut tamamlamayi reddet — hayalet metni kaldir
export function dismissCompletion() {
    if (!pendingCompletion) {
        return { success: true, message: "No pending completion" };
    }

    clearGhostText();
    editor.events.emit("claude.completionDismissed", "{}");

    return { success: true };
}

// Register completion commands
// Tamamlama komutlarini kaydet
export function registerCompletionCommands() {

    // claude.complete — request an inline AI completion
    // claude.complete — bir satir ici AI tamamlamasi iste
    editor.commands.register("claude.complete", () => {
        return requestCompletion();
    });

    // claude.acceptCompletion — accept and insert the ghost text
    // claude.acceptCompletion — hayalet metni kabul et ve ekle
    editor.commands.register("claude.acceptCompletion", () => {
        return acceptCompletion();
    });

    // claude.dismissCompletion — clear the ghost text
    // claude.dismissCompletion — hayalet metni temizle
    editor.commands.register("claude.dismissCompletion", () => {
        return dismissCompletion();
    });
}
