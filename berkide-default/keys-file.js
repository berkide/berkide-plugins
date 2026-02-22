// File and buffer operations keybindings
// Dosya ve buffer islem tus baglantilari

export function registerFileCommands() {
    const set = (key, command, args) => {
        if (args) {
            editor.keymaps.set("global", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("global", key, command);
        }
    };

    // ── Save (Ctrl+S) ────────────────────────────────────────────
    // ── Kaydet (Ctrl+S) ──────────────────────────────────────────
    set("ctrl+s", "file.save");

    // ── Save As (Ctrl+Shift+S) ────────────────────────────────────
    // ── Farkli kaydet (Ctrl+Shift+S) ──────────────────────────────
    set("ctrl+shift+s", "file.saveAs");

    // ── Open file (Ctrl+O) ────────────────────────────────────────
    // ── Dosya ac (Ctrl+O) ─────────────────────────────────────────
    set("ctrl+o", "file.open");

    // ── New buffer (Ctrl+N) ───────────────────────────────────────
    // ── Yeni buffer (Ctrl+N) ──────────────────────────────────────
    set("ctrl+n", "buffer.new");

    // ── Close buffer (Ctrl+W) ─────────────────────────────────────
    // ── Buffer kapat (Ctrl+W) ─────────────────────────────────────
    set("ctrl+w", "tab.close");

    // ── Switch tabs (Ctrl+Tab / Ctrl+Shift+Tab) ───────────────────
    // ── Sekme degistir (Ctrl+Tab / Ctrl+Shift+Tab) ────────────────
    set("ctrl+Tab", "tab.next");
    set("ctrl+shift+Tab", "tab.prev");

    // ── Switch to tab by number (Ctrl+1..9) ───────────────────────
    // ── Numaraya gore sekmeye gec (Ctrl+1..9) ─────────────────────
    set("ctrl+1", "tab.switchTo", { index: 0 });
    set("ctrl+2", "tab.switchTo", { index: 1 });
    set("ctrl+3", "tab.switchTo", { index: 2 });
    set("ctrl+4", "tab.switchTo", { index: 3 });
    set("ctrl+5", "tab.switchTo", { index: 4 });
    set("ctrl+6", "tab.switchTo", { index: 5 });
    set("ctrl+7", "tab.switchTo", { index: 6 });
    set("ctrl+8", "tab.switchTo", { index: 7 });
    set("ctrl+9", "tab.switchTo", { index: 8 });

    // ── Save all (Ctrl+Shift+N) ───────────────────────────────────
    // ── Tumunu kaydet (Ctrl+Shift+N) ──────────────────────────────
    set("ctrl+shift+n", "file.saveAll");

    // ── Quit (Ctrl+Q) ─────────────────────────────────────────────
    // ── Cikis (Ctrl+Q) ────────────────────────────────────────────
    set("ctrl+q", "app.quit");
}
