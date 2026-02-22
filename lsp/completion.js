// LSP completion handler — feeds results into CompletionEngine
// LSP tamamlama isleyicisi — sonuclari CompletionEngine'e besler

// LSP CompletionItemKind enum
// LSP TamamlamaOgeTuru numaralandirmasi
const ITEM_KIND = {
    1: "text", 2: "method", 3: "function", 4: "constructor",
    5: "field", 6: "variable", 7: "class", 8: "interface",
    9: "module", 10: "property", 11: "unit", 12: "value",
    13: "enum", 14: "keyword", 15: "snippet", 16: "color",
    17: "file", 18: "reference", 19: "folder", 20: "enumMember",
    21: "constant", 22: "struct", 23: "event", 24: "operator",
    25: "typeParameter",
};

// Transform LSP completion items into BerkIDE completion format
// LSP tamamlama ogelerini BerkIDE tamamlama formatina donustur
export function transformCompletions(result) {
    const items = result?.items || result || [];

    return items.map(item => ({
        label: item.label,
        kind: ITEM_KIND[item.kind] || "text",
        detail: item.detail || "",
        documentation: extractDocumentation(item.documentation),
        insertText: item.insertText || item.textEdit?.newText || item.label,
        sortText: item.sortText || item.label,
        filterText: item.filterText || item.label,
    }));
}

// Extract documentation string from LSP MarkupContent or string
// LSP MarkupContent veya string'den dokumantasyon dizesini cikar
function extractDocumentation(doc) {
    if (!doc) return "";
    if (typeof doc === "string") return doc;
    if (doc.value) return doc.value; // MarkupContent { kind, value }
    return "";
}

// Feed completions into core CompletionEngine
// Tamamlamalari cekirdek CompletionEngine'e besle
export function applyCompletions(completions, prefix) {
    for (const item of completions) {
        editor.completion.addItem?.(item.label, item.kind, item.detail);
    }
}
