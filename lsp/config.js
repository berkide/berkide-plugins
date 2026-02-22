// LSP server configuration — maps file extensions to language server commands
// LSP sunucu yapilandirmasi — dosya uzantilarini dil sunucusu komutlarina esler
//
// Users can override this via editor.commands.exec("lsp.configure", {...})
// Kullanicilar bunu editor.commands.exec("lsp.configure", {...}) ile gecersiz kilabilir

// Default language server configurations
// Varsayilan dil sunucusu yapilandirmalari
export const serverConfigs = {
    javascript: {
        command: "typescript-language-server",
        args: ["--stdio"],
        rootPatterns: ["package.json", "tsconfig.json", "jsconfig.json"],
        languageId: "javascript",
    },
    typescript: {
        command: "typescript-language-server",
        args: ["--stdio"],
        rootPatterns: ["tsconfig.json", "package.json"],
        languageId: "typescript",
    },
    python: {
        command: "pylsp",
        args: [],
        rootPatterns: ["pyproject.toml", "setup.py", "requirements.txt"],
        languageId: "python",
    },
    rust: {
        command: "rust-analyzer",
        args: [],
        rootPatterns: ["Cargo.toml"],
        languageId: "rust",
    },
    go: {
        command: "gopls",
        args: [],
        rootPatterns: ["go.mod"],
        languageId: "go",
    },
    c: {
        command: "clangd",
        args: [],
        rootPatterns: ["compile_commands.json", "CMakeLists.txt", "Makefile"],
        languageId: "c",
    },
    cpp: {
        command: "clangd",
        args: [],
        rootPatterns: ["compile_commands.json", "CMakeLists.txt", "Makefile"],
        languageId: "cpp",
    },
    java: {
        command: "jdtls",
        args: [],
        rootPatterns: ["pom.xml", "build.gradle"],
        languageId: "java",
    },
    lua: {
        command: "lua-language-server",
        args: [],
        rootPatterns: [".luarc.json"],
        languageId: "lua",
    },
    html: {
        command: "vscode-html-language-server",
        args: ["--stdio"],
        rootPatterns: ["package.json"],
        languageId: "html",
    },
    css: {
        command: "vscode-css-language-server",
        args: ["--stdio"],
        rootPatterns: ["package.json"],
        languageId: "css",
    },
    json: {
        command: "vscode-json-language-server",
        args: ["--stdio"],
        rootPatterns: [],
        languageId: "json",
    },
};

// File extension → language mapping
// Dosya uzantisi → dil eslesmesi
export const extToLanguage = {
    ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript", ".mts": "typescript",
    ".py": "python", ".pyw": "python",
    ".rs": "rust",
    ".go": "go",
    ".c": "c", ".h": "c",
    ".cpp": "cpp", ".cc": "cpp", ".cxx": "cpp", ".hpp": "cpp",
    ".java": "java",
    ".lua": "lua",
    ".html": "html", ".htm": "html",
    ".css": "css", ".scss": "css",
    ".json": "json",
};

// Detect language from file path
// Dosya yolundan dili algila
export function detectLanguage(filePath) {
    const dotIdx = filePath.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const ext = filePath.substring(dotIdx);
    return extToLanguage[ext] || null;
}

// Get server config for a language
// Bir dil icin sunucu yapilandirmasini al
export function getServerConfig(language) {
    return serverConfigs[language] || null;
}
