// LSP diagnostics handler — shows errors/warnings as extmarks
// LSP tani isleyicisi — hatalari/uyarilari extmark olarak gosterir

// LSP DiagnosticSeverity enum
// LSP TaniCiddiyeti numaralandirmasi
const SEVERITY = {
    1: "error",
    2: "warning",
    3: "info",
    4: "hint",
};

// Handle textDocument/publishDiagnostics notification from server
// Sunucudan gelen textDocument/publishDiagnostics bildirimini isle
export function handleDiagnostics(params) {
    const uri = params.uri;
    const diagnostics = params.diagnostics || [];

    // Clear previous diagnostic extmarks for this file
    // Bu dosya icin onceki tani extmark'larini temizle
    editor.extmarks.clearNamespace("lsp-diagnostics");

    const results = [];

    for (const diag of diagnostics) {
        const startLine = diag.range.start.line;
        const startCol = diag.range.start.character;
        const endLine = diag.range.end.line;
        const endCol = diag.range.end.character;
        const severity = SEVERITY[diag.severity] || "error";
        const message = diag.message;
        const source = diag.source || "";
        const code = diag.code || "";

        // Create extmark for the diagnostic range
        // Tani araligi icin extmark olustur
        editor.extmarks.set(
            "lsp-diagnostics",
            startLine, startCol,
            endLine, endCol,
            severity,
            JSON.stringify({ message, source, code })
        );

        // Show message as virtual text at end of line
        // Mesaji satir sonunda sanal metin olarak goster
        const shortMsg = message.split('\n')[0]; // first line only
        editor.extmarks.setWithVirtText(
            "lsp-diagnostics",
            startLine, startCol,
            startLine, startCol,
            `${severity}: ${shortMsg}`,
            "eol",
            severity,
            "diagnostic-virt",
            ""
        );

        results.push({ startLine, startCol, endLine, endCol, severity, message, source, code });
    }

    // Emit event for UI to render diagnostic decorations
    // UI'nin tani dekorasyonlarini renderlemesi icin olay yay
    editor.events.emit("lsp.diagnosticsUpdated", JSON.stringify({
        uri,
        count: results.length,
        diagnostics: results,
    }));

    return results;
}
