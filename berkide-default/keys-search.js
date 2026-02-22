// Search and replace keybindings
// Arama ve degistirme tus baglantilari

export function registerSearchCommands() {
    const set = (key, command, args) => {
        if (args) {
            editor.keymaps.set("global", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("global", key, command);
        }
    };

    // ── Find (Ctrl+F) ────────────────────────────────────────────
    // ── Bul (Ctrl+F) ─────────────────────────────────────────────
    set("ctrl+f", "search.forward");

    // ── Find and Replace (Ctrl+H) ─────────────────────────────────
    // ── Bul ve Degistir (Ctrl+H) ──────────────────────────────────
    set("ctrl+h", "search.replace");

    // ── Replace all (Ctrl+Shift+H) ────────────────────────────────
    // ── Tumunu degistir (Ctrl+Shift+H) ────────────────────────────
    set("ctrl+shift+h", "search.replaceAll");

    // ── Find next / previous (F3 / Shift+F3) ──────────────────────
    // ── Sonraki / onceki bul (F3 / Shift+F3) ──────────────────────
    set("F3", "search.next");
    set("shift+F3", "search.prev");

    // ── Find backward (Ctrl+Shift+F) ──────────────────────────────
    // ── Geriye dogru bul (Ctrl+Shift+F) ───────────────────────────
    set("ctrl+shift+f", "search.backward");
}
