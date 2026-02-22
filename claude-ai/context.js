// Smart context builder — collects relevant code context for AI requests
// Akilli baglam olusturucu — AI istekleri icin ilgili kod baglamini toplar
//
// Builds context from buffer state, cursor position, selection, and project structure.
// Buffer durumundan, imlec konumundan, secimden ve proje yapisindan baglam olusturur.
// Provides smart truncation to stay within token limits.
// Token sinirlarinda kalmak icin akilli kirpma saglar.

// File extension to language name mapping
// Dosya uzantisini dil adina esleme
const extToLang = {
    ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript",
    ".py": "python", ".pyw": "python",
    ".rs": "rust",
    ".go": "go",
    ".c": "c", ".h": "c",
    ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp",
    ".java": "java",
    ".lua": "lua",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".sh": "shell", ".bash": "shell", ".zsh": "shell",
    ".html": "html", ".htm": "html",
    ".css": "css", ".scss": "scss", ".less": "less",
    ".json": "json",
    ".yaml": "yaml", ".yml": "yaml",
    ".toml": "toml",
    ".md": "markdown",
    ".sql": "sql",
    ".r": "r", ".R": "r",
    ".ex": "elixir", ".exs": "elixir",
    ".zig": "zig",
    ".nim": "nim",
    ".dart": "dart",
};

// Detect language from file path
// Dosya yolundan dili algila
function detectLanguage(filePath) {
    if (!filePath) return "text";
    const dotIdx = filePath.lastIndexOf(".");
    if (dotIdx === -1) return "text";
    const ext = filePath.substring(dotIdx);
    return extToLang[ext] || "text";
}

// Get current buffer context — everything about the active editing state
// Mevcut buffer baglamini al — aktif duzenleme durumu hakkinda hersey
export function getCurrentContext() {
    try {
        const state = editor.state.get();
        const bufId = state?.activeBuffer;

        // Get buffer content
        // Buffer icerigini al
        let bufferContent = "";
        let filePath = "";
        try {
            const info = editor.buffers.info(bufId);
            filePath = info?.filePath || info?.name || "";
            bufferContent = editor.buffers.getText(bufId) || "";
        } catch (e) {
            bufferContent = "";
        }

        // Get cursor position
        // Imlec konumunu al
        let cursorLine = 0;
        let cursorCol = 0;
        try {
            const cursor = editor.cursor.get();
            cursorLine = cursor?.line || 0;
            cursorCol = cursor?.col || 0;
        } catch (e) { /* ignore */ }

        // Get selection if active
        // Aktifse secimi al
        let selection = null;
        try {
            const sel = editor.selection.get();
            if (sel && sel.active) {
                selection = {
                    startLine: sel.startLine,
                    startCol: sel.startCol,
                    endLine: sel.endLine,
                    endCol: sel.endCol,
                    text: sel.text || "",
                };
            }
        } catch (e) { /* no selection */ }

        // Detect language from file extension
        // Dosya uzantisindan dili algila
        const language = detectLanguage(filePath);

        return {
            filePath,
            language,
            bufferContent,
            cursorLine,
            cursorCol,
            selection,
            lineCount: bufferContent.split("\n").length,
        };
    } catch (e) {
        return {
            filePath: "",
            language: "text",
            bufferContent: "",
            cursorLine: 0,
            cursorCol: 0,
            selection: null,
            lineCount: 0,
        };
    }
}

// Get project context — scan imports/requires to understand project structure
// Proje baglamini al — proje yapisini anlamak icin import/require tarama
export function getProjectContext() {
    const ctx = getCurrentContext();
    const result = {
        currentFile: ctx.filePath,
        language: ctx.language,
        imports: [],
        projectFiles: [],
    };

    if (!ctx.bufferContent) return result;

    // Extract import/require statements from current buffer
    // Mevcut buffer'dan import/require ifadelerini cikar
    const lines = ctx.bufferContent.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();

        // ES6 imports: import ... from '...'
        // ES6 import'lar: import ... from '...'
        const esMatch = trimmed.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
        if (esMatch) {
            result.imports.push({ type: "import", module: esMatch[1] });
            continue;
        }

        // CommonJS requires: const x = require('...')
        // CommonJS require'lar: const x = require('...')
        const cjsMatch = trimmed.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (cjsMatch) {
            result.imports.push({ type: "require", module: cjsMatch[1] });
            continue;
        }

        // Python imports: import x / from x import y
        // Python import'lar: import x / from x import y
        const pyMatch = trimmed.match(/^(?:from\s+(\S+)\s+)?import\s+(\S+)/);
        if (pyMatch && ctx.language === "python") {
            result.imports.push({ type: "python-import", module: pyMatch[1] || pyMatch[2] });
            continue;
        }

        // Rust use: use crate::...
        // Rust use: use crate::...
        const rustMatch = trimmed.match(/^use\s+([\w:]+)/);
        if (rustMatch && ctx.language === "rust") {
            result.imports.push({ type: "use", module: rustMatch[1] });
            continue;
        }

        // Go imports: import "..."
        // Go import'lar: import "..."
        const goMatch = trimmed.match(/^import\s+(?:\w+\s+)?["']([^"']+)["']/);
        if (goMatch && ctx.language === "go") {
            result.imports.push({ type: "go-import", module: goMatch[1] });
            continue;
        }

        // C/C++ includes: #include <...> or #include "..."
        // C/C++ include'lar: #include <...> veya #include "..."
        const cMatch = trimmed.match(/^#include\s+[<"]([^>"]+)[>"]/);
        if (cMatch && (ctx.language === "c" || ctx.language === "cpp")) {
            result.imports.push({ type: "include", module: cMatch[1] });
            continue;
        }
    }

    // List open buffers as project context
    // Acik buffer'lari proje baglami olarak listele
    try {
        const buffers = editor.buffers.list();
        if (Array.isArray(buffers)) {
            for (const buf of buffers) {
                const name = buf?.filePath || buf?.name || "";
                if (name && name !== ctx.filePath) {
                    result.projectFiles.push(name);
                }
            }
        }
    } catch (e) { /* ignore */ }

    return result;
}

// Smart truncation — keeps the most relevant parts within maxChars limit
// Akilli kirpma — en ilgili kisimlari maxChars siniri icinde tutar
//
// Strategy: keep first N lines (file header/imports) + lines around cursor + last N lines
// Strateji: ilk N satir (dosya baslik/import'lar) + imlec etrafindaki satirlar + son N satir
export function truncateContext(text, maxChars, cursorLine) {
    if (!text || text.length <= maxChars) return text;

    const lines = text.split("\n");
    const totalLines = lines.length;

    // Reserve space for header, cursor region, and footer
    // Baslik, imlec bolgesi ve altbilgi icin yer ayir
    const headerLines = Math.min(30, Math.floor(totalLines * 0.15));
    const footerLines = Math.min(15, Math.floor(totalLines * 0.05));
    const cursorRadius = 50;

    // Build sections
    // Bolumleri olustur
    const header = lines.slice(0, headerLines);
    const footer = lines.slice(Math.max(totalLines - footerLines, headerLines));

    // Cursor region
    // Imlec bolgesi
    const curLine = cursorLine || Math.floor(totalLines / 2);
    const regionStart = Math.max(headerLines, curLine - cursorRadius);
    const regionEnd = Math.min(totalLines - footerLines, curLine + cursorRadius);
    const cursorRegion = lines.slice(regionStart, regionEnd);

    // Assemble with markers
    // Isaretcilerle birlesir
    const parts = [];
    parts.push(header.join("\n"));

    if (regionStart > headerLines) {
        parts.push("\n// ... (" + (regionStart - headerLines) + " lines omitted) ...\n");
    }

    parts.push(cursorRegion.join("\n"));

    if (regionEnd < totalLines - footerLines) {
        parts.push("\n// ... (" + (totalLines - footerLines - regionEnd) + " lines omitted) ...\n");
    }

    parts.push(footer.join("\n"));

    let result = parts.join("\n");

    // Final hard truncation if still over limit
    // Hala sinirin ustundeyse son sert kirpma
    if (result.length > maxChars) {
        result = result.substring(0, maxChars) + "\n// ... (truncated)";
    }

    return result;
}

// Get surrounding lines around cursor for completion prompts
// Tamamlama istemleri icin imlec etrafindaki satirlari al
export function getSurroundingLines(content, cursorLine, beforeCount, afterCount) {
    if (!content) return { before: "", after: "", currentLine: "" };

    const lines = content.split("\n");
    const lineIdx = Math.max(0, Math.min(cursorLine, lines.length - 1));

    const startBefore = Math.max(0, lineIdx - beforeCount);
    const endAfter = Math.min(lines.length, lineIdx + afterCount + 1);

    return {
        before: lines.slice(startBefore, lineIdx).join("\n"),
        currentLine: lines[lineIdx] || "",
        after: lines.slice(lineIdx + 1, endAfter).join("\n"),
    };
}
