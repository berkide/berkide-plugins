// LSP hover handler — show type/doc info at cursor position
// LSP gezdirme isleyicisi — imlec konumunda tip/doc bilgisi goster

// Transform LSP hover response into display format
// LSP gezdirme yanitini gorunum formatina donustur
export function transformHover(result) {
    if (!result || !result.contents) return null;

    let text = "";

    if (typeof result.contents === "string") {
        text = result.contents;
    } else if (Array.isArray(result.contents)) {
        text = result.contents.map(c => {
            if (typeof c === "string") return c;
            if (c.value) return c.value;
            return "";
        }).join("\n\n");
    } else if (result.contents.value) {
        text = result.contents.value;
    }

    const range = result.range ? {
        startLine: result.range.start.line,
        startCol: result.range.start.character,
        endLine: result.range.end.line,
        endCol: result.range.end.character,
    } : null;

    return { text, range };
}
