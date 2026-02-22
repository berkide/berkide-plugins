// Comment toggle plugin — toggle line/block comments per language
// Yorum degistirme eklentisi — dile gore satir/blok yorum degistirme
//
// Detects language from file extension and applies the correct comment style.
// Dosya uzantisindan dili algilar ve dogru yorum stilini uygular.

// Comment style definitions per language
// Dile gore yorum stili tanimlari
const commentStyles = {
    // Line comment, Block comment open, Block comment close
    // Satir yorumu, Blok yorum acilis, Blok yorum kapanis
    javascript:  { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    typescript:  { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    jsx:         { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    tsx:         { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    java:        { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    c:           { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    cpp:         { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    csharp:      { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    go:          { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    rust:        { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    swift:       { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    kotlin:      { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    dart:        { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    php:         { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    scala:       { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    css:         { line: null,  blockOpen: "/*",  blockClose: "*/" },
    scss:        { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    less:        { line: "//",  blockOpen: "/*",  blockClose: "*/" },
    python:      { line: "#",   blockOpen: '"""', blockClose: '"""' },
    ruby:        { line: "#",   blockOpen: "=begin", blockClose: "=end" },
    perl:        { line: "#",   blockOpen: null,  blockClose: null },
    bash:        { line: "#",   blockOpen: null,  blockClose: null },
    shell:       { line: "#",   blockOpen: null,  blockClose: null },
    zsh:         { line: "#",   blockOpen: null,  blockClose: null },
    fish:        { line: "#",   blockOpen: null,  blockClose: null },
    yaml:        { line: "#",   blockOpen: null,  blockClose: null },
    toml:        { line: "#",   blockOpen: null,  blockClose: null },
    makefile:    { line: "#",   blockOpen: null,  blockClose: null },
    dockerfile:  { line: "#",   blockOpen: null,  blockClose: null },
    r:           { line: "#",   blockOpen: null,  blockClose: null },
    elixir:      { line: "#",   blockOpen: null,  blockClose: null },
    html:        { line: null,  blockOpen: "<!--", blockClose: "-->" },
    xml:         { line: null,  blockOpen: "<!--", blockClose: "-->" },
    svg:         { line: null,  blockOpen: "<!--", blockClose: "-->" },
    sql:         { line: "--",  blockOpen: "/*",  blockClose: "*/" },
    lua:         { line: "--",  blockOpen: "--[[", blockClose: "]]" },
    haskell:     { line: "--",  blockOpen: "{-",  blockClose: "-}" },
    elm:         { line: "--",  blockOpen: "{-",  blockClose: "-}" },
    vim:         { line: '"',   blockOpen: null,  blockClose: null },
    lisp:        { line: ";",   blockOpen: null,  blockClose: null },
    clojure:     { line: ";",   blockOpen: null,  blockClose: null },
    ini:         { line: ";",   blockOpen: null,  blockClose: null },
    latex:       { line: "%",   blockOpen: null,  blockClose: null },
    erlang:      { line: "%",   blockOpen: null,  blockClose: null },
    fortran:     { line: "!",   blockOpen: null,  blockClose: null },
};

// File extension → language mapping
// Dosya uzantisi → dil eslesmesi
const extToLang = {
    ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".mts": "typescript",
    ".jsx": "jsx", ".tsx": "tsx",
    ".java": "java",
    ".c": "c", ".h": "c",
    ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp", ".hh": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".swift": "swift",
    ".kt": "kotlin", ".kts": "kotlin",
    ".dart": "dart",
    ".php": "php",
    ".scala": "scala",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".py": "python", ".pyw": "python",
    ".rb": "ruby",
    ".pl": "perl", ".pm": "perl",
    ".sh": "bash", ".bash": "bash",
    ".zsh": "zsh",
    ".fish": "fish",
    ".yml": "yaml", ".yaml": "yaml",
    ".toml": "toml",
    ".r": "r", ".R": "r",
    ".ex": "elixir", ".exs": "elixir",
    ".html": "html", ".htm": "html",
    ".xml": "xml",
    ".svg": "svg",
    ".sql": "sql",
    ".lua": "lua",
    ".hs": "haskell",
    ".elm": "elm",
    ".vim": "vim",
    ".el": "lisp", ".lisp": "lisp",
    ".clj": "clojure", ".cljs": "clojure",
    ".ini": "ini", ".cfg": "ini",
    ".tex": "latex",
    ".erl": "erlang",
    ".f90": "fortran", ".f95": "fortran",
};

// Detect language from active buffer's file path
// Aktif buffer'in dosya yolundan dili algila
function detectLanguage() {
    const buffers = editor.buffers.list();
    if (!buffers || buffers.length === 0) return null;

    const filePath = buffers[editor.buffers.activeIndex?.() ?? 0]?.path || "";
    const dotIdx = filePath.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const ext = filePath.substring(dotIdx);
    return extToLang[ext] || null;
}

// Get comment style for current file
// Mevcut dosya icin yorum stilini al
function getStyle() {
    const lang = detectLanguage();
    if (!lang) return commentStyles.javascript; // fallback
    return commentStyles[lang] || commentStyles.javascript;
}

// Toggle line comment on current line or selection
// Mevcut satir veya secimde satir yorumunu degistir
editor.commands.register("comment.toggleLine", () => {
    const style = getStyle();
    if (!style.line) return; // Language has no line comment

    const prefix = style.line + " ";
    let startLine, endLine;

    if (editor.selection.isActive()) {
        const range = editor.selection.getRange();
        startLine = range.startLine;
        endLine = range.endLine;
    } else {
        startLine = editor.cursor.getLine();
        endLine = startLine;
    }

    // Check if all lines are already commented
    // Tum satirlarin zaten yorumlu olup olmadigini kontrol et
    let allCommented = true;
    for (let i = startLine; i <= endLine; i++) {
        const text = editor.buffer.getLine(i);
        const trimmed = text.trimStart();
        if (trimmed.length > 0 && !trimmed.startsWith(style.line)) {
            allCommented = false;
            break;
        }
    }

    // Toggle: remove or add comments
    // Degistir: yorumlari kaldir veya ekle
    for (let i = startLine; i <= endLine; i++) {
        const text = editor.buffer.getLine(i);
        if (text.trim().length === 0) continue; // skip empty lines

        if (allCommented) {
            // Remove comment
            // Yorumu kaldir
            const idx = text.indexOf(style.line);
            if (idx !== -1) {
                let removeLen = style.line.length;
                if (text[idx + removeLen] === ' ') removeLen++; // remove trailing space
                editor.buffer.deleteRange(i, idx, i, idx + removeLen);
            }
        } else {
            // Add comment at the start of text (after leading whitespace)
            // Metnin basina yorum ekle (bosluktan sonra)
            const indent = text.length - text.trimStart().length;
            editor.buffer.insertText(i, indent, prefix);
        }
    }
});

// Toggle block comment on selection
// Secimde blok yorumunu degistir
editor.commands.register("comment.toggleBlock", () => {
    const style = getStyle();
    if (!style.blockOpen || !style.blockClose) return;

    if (!editor.selection.isActive()) return;

    const range = editor.selection.getRange();
    const text = editor.selection.getText();

    if (text.startsWith(style.blockOpen) && text.endsWith(style.blockClose)) {
        // Remove block comment
        // Blok yorumunu kaldir
        const inner = text.slice(style.blockOpen.length, -style.blockClose.length);
        editor.buffer.deleteRange(range.startLine, range.startCol, range.endLine, range.endCol);
        editor.buffer.insertText(range.startLine, range.startCol, inner);
    } else {
        // Add block comment
        // Blok yorumu ekle
        editor.buffer.deleteRange(range.startLine, range.startCol, range.endLine, range.endCol);
        editor.buffer.insertText(range.startLine, range.startCol,
            style.blockOpen + " " + text + " " + style.blockClose);
    }

    editor.selection.clear();
});

// Allow other plugins to register comment styles for new languages
// Diger eklentilerin yeni diller icin yorum stilleri kaydetmesine izin ver
editor.commands.register("comment.registerLanguage", (args) => {
    if (!args?.language || !args?.style) return { error: "Provide language and style" };
    commentStyles[args.language] = args.style;
    return { registered: args.language };
});

editor.commands.register("comment.registerExtension", (args) => {
    if (!args?.ext || !args?.language) return { error: "Provide ext and language" };
    extToLang[args.ext] = args.language;
    return { registered: args.ext + " → " + args.language };
});

editor.commands.register("comment.listLanguages", () => {
    return Object.keys(commentStyles);
});

console.log("[comment-toggle] Loaded: " + Object.keys(commentStyles).length + " languages");
