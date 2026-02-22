// Cursor movement and navigation keybindings + JS helper commands
// Imlec hareketi ve gezinme tus baglantilari + JS yardimci komutlari

export function registerNavCommands() {
    const set = (key, command, args) => {
        if (args) {
            editor.keymaps.set("global", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("global", key, command);
        }
    };

    // ── JS helper commands (not available as C++ native) ──────────
    // ── JS yardimci komutlari (C++ native olarak mevcut degil) ────

    // Word-level cursor movement
    // Kelime bazli imlec hareketi
    editor.commands.register("cursor.wordLeft", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.prevWordStart", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    editor.commands.register("cursor.wordRight", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.nextWordStart", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    // Page scroll (20 lines at a time)
    // Sayfa kaydirma (bir seferde 20 satir)
    editor.commands.register("cursor.pageUp", () => {
        for (let i = 0; i < 20; i++) editor.commands.exec("cursor.up");
    });

    editor.commands.register("cursor.pageDown", () => {
        for (let i = 0; i < 20; i++) editor.commands.exec("cursor.down");
    });

    // Document start / end
    // Belge basi / sonu
    editor.commands.register("cursor.docStart", () => {
        editor.commands.exec("cursor.setPosition", { line: 0, col: 0 });
    });

    editor.commands.register("cursor.docEnd", () => {
        const count = editor.commands.exec("buffer.lineCount");
        const lastLine = (count && count.count) ? count.count - 1 : 0;
        const colCount = editor.commands.exec("buffer.columnCount", { line: lastLine });
        const lastCol = (colCount && colCount.count) ? colCount.count : 0;
        editor.commands.exec("cursor.setPosition", { line: lastLine, col: lastCol });
    });

    // Go to line (emits UI event for line input prompt)
    // Satira git (satir girisi istemi icin UI olayi yayinlar)
    editor.commands.register("cursor.gotoLine", () => {
        editor.events.emit("ui.gotoLine");
    });

    // Selection extension helpers — set anchor if not active, then move cursor
    // Secim genisletme yardimcilari — aktif degilse capa koy, sonra imleci tasi
    const extendSelection = (moveCmd, moveArgs) => {
        const sel = editor.commands.exec("selection.isActive");
        if (!sel || !sel.active) {
            const pos = editor.commands.exec("cursor.getPosition");
            if (pos) editor.commands.exec("selection.setAnchor", pos);
        }
        if (moveArgs) {
            editor.commands.exec(moveCmd, moveArgs);
        } else {
            editor.commands.exec(moveCmd);
        }
    };

    editor.commands.register("selection.up", () => extendSelection("cursor.up"));
    editor.commands.register("selection.down", () => extendSelection("cursor.down"));
    editor.commands.register("selection.left", () => extendSelection("cursor.left"));
    editor.commands.register("selection.right", () => extendSelection("cursor.right"));
    editor.commands.register("selection.home", () => extendSelection("cursor.home"));
    editor.commands.register("selection.end", () => extendSelection("cursor.end"));
    editor.commands.register("selection.wordLeft", () => extendSelection("cursor.wordLeft"));
    editor.commands.register("selection.wordRight", () => extendSelection("cursor.wordRight"));

    // ── Arrow keys ────────────────────────────────────────────────
    // ── Ok tuslari ────────────────────────────────────────────────
    set("Up", "cursor.up");
    set("Down", "cursor.down");
    set("Left", "cursor.left");
    set("Right", "cursor.right");

    // ── Home / End ────────────────────────────────────────────────
    set("Home", "cursor.home");
    set("End", "cursor.end");

    // ── Word movement (Ctrl+Arrow) ────────────────────────────────
    // ── Kelime hareketi (Ctrl+Ok) ─────────────────────────────────
    set("ctrl+Left", "cursor.wordLeft");
    set("ctrl+Right", "cursor.wordRight");

    // ── Page Up / Page Down ───────────────────────────────────────
    set("PageUp", "cursor.pageUp");
    set("PageDown", "cursor.pageDown");

    // ── Document start / end (Ctrl+Home / Ctrl+End) ───────────────
    // ── Belge basi / sonu (Ctrl+Home / Ctrl+End) ──────────────────
    set("ctrl+Home", "cursor.docStart");
    set("ctrl+End", "cursor.docEnd");

    // ── Go to line (Ctrl+G) ───────────────────────────────────────
    // ── Satira git (Ctrl+G) ───────────────────────────────────────
    set("ctrl+g", "cursor.gotoLine");

    // ── Selection with Shift ──────────────────────────────────────
    // ── Shift ile secim ───────────────────────────────────────────
    set("shift+Up", "selection.up");
    set("shift+Down", "selection.down");
    set("shift+Left", "selection.left");
    set("shift+Right", "selection.right");
    set("shift+Home", "selection.home");
    set("shift+End", "selection.end");
    set("ctrl+shift+Left", "selection.wordLeft");
    set("ctrl+shift+Right", "selection.wordRight");

    // ── Select All (Ctrl+A) ───────────────────────────────────────
    // ── Tumunu sec (Ctrl+A) ───────────────────────────────────────
    set("ctrl+a", "selection.selectAll");
}
