// Text editing and clipboard keybindings + JS helper commands
// Metin duzenleme ve pano tus baglantilari + JS yardimci komutlari

export function registerEditingCommands() {
    const set = (key, command, args) => {
        if (args) {
            editor.keymaps.set("global", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("global", key, command);
        }
    };

    // ── JS helper commands (not available as C++ native) ──────────
    // ── JS yardimci komutlari (C++ native olarak mevcut degil) ────

    // Duplicate current line
    // Mevcut satiri kopyala
    editor.commands.register("edit.duplicateLine", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const lineData = editor.commands.exec("buffer.getLine", { line: pos.line });
        if (!lineData || lineData.text === undefined) return;
        editor.commands.exec("buffer.insertLine", { line: pos.line + 1, text: lineData.text });
        editor.commands.exec("cursor.setPosition", { line: pos.line + 1, col: pos.col });
    });

    // Move line up
    // Satiri yukari tasi
    editor.commands.register("edit.moveLineUp", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos || pos.line <= 0) return;

        const curLine = editor.commands.exec("buffer.getLine", { line: pos.line });
        const prevLine = editor.commands.exec("buffer.getLine", { line: pos.line - 1 });
        if (!curLine || !prevLine) return;

        editor.commands.exec("edit.beginGroup");
        editor.commands.exec("buffer.deleteRange", {
            startLine: pos.line - 1, startCol: 0,
            endLine: pos.line, endCol: curLine.text.length
        });
        editor.commands.exec("buffer.insertLine", { line: pos.line - 1, text: curLine.text });
        editor.commands.exec("buffer.insertLine", { line: pos.line, text: prevLine.text });
        editor.commands.exec("edit.endGroup");

        editor.commands.exec("cursor.setPosition", { line: pos.line - 1, col: pos.col });
    });

    // Move line down
    // Satiri asagi tasi
    editor.commands.register("edit.moveLineDown", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const count = editor.commands.exec("buffer.lineCount");
        if (!count || pos.line >= count.count - 1) return;

        const curLine = editor.commands.exec("buffer.getLine", { line: pos.line });
        const nextLine = editor.commands.exec("buffer.getLine", { line: pos.line + 1 });
        if (!curLine || !nextLine) return;

        editor.commands.exec("edit.beginGroup");
        editor.commands.exec("buffer.deleteRange", {
            startLine: pos.line, startCol: 0,
            endLine: pos.line + 1, endCol: nextLine.text.length
        });
        editor.commands.exec("buffer.insertLine", { line: pos.line, text: nextLine.text });
        editor.commands.exec("buffer.insertLine", { line: pos.line + 1, text: curLine.text });
        editor.commands.exec("edit.endGroup");

        editor.commands.exec("cursor.setPosition", { line: pos.line + 1, col: pos.col });
    });

    // Escape — clear selection and multicursor
    // Escape — secimi ve multicursor'u temizle
    editor.commands.register("edit.escape", () => {
        editor.commands.exec("selection.clear");
        editor.commands.exec("multicursor.clear");
    });

    // ── Basic text input ──────────────────────────────────────────
    // ── Temel metin girisi ────────────────────────────────────────
    set("Enter", "input.key", { key: "Enter" });
    set("Backspace", "input.key", { key: "Backspace" });
    set("Delete", "input.key", { key: "Delete" });
    set("Tab", "indent.increase");
    set("shift+Tab", "indent.decrease");

    // ── Undo / Redo ───────────────────────────────────────────────
    // ── Geri al / Yinele ──────────────────────────────────────────
    set("ctrl+z", "edit.undo");
    set("ctrl+y", "edit.redo");
    set("ctrl+shift+z", "edit.redo");

    // ── Clipboard ─────────────────────────────────────────────────
    // ── Pano ──────────────────────────────────────────────────────
    set("ctrl+c", "edit.yank");
    set("ctrl+x", "edit.cut");
    set("ctrl+v", "edit.paste");

    // ── Duplicate line (Ctrl+D) ───────────────────────────────────
    // ── Satiri kopyala (Ctrl+D) ───────────────────────────────────
    set("ctrl+d", "edit.duplicateLine");

    // ── Delete line (Ctrl+Shift+K) ────────────────────────────────
    // ── Satiri sil (Ctrl+Shift+K) ─────────────────────────────────
    set("ctrl+shift+k", "edit.deleteLine");

    // ── Move line up/down (Alt+Up/Down) ───────────────────────────
    // ── Satiri yukari/asagi tasi (Alt+Up/Down) ────────────────────
    set("alt+Up", "edit.moveLineUp");
    set("alt+Down", "edit.moveLineDown");

    // ── Escape: clear selection, cancel operation ─────────────────
    // ── Escape: secimi temizle, islemi iptal et ───────────────────
    set("Escape", "edit.escape");
}
