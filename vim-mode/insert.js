// Vim insert mode keybindings — text input with escape back to normal
// Vim insert mod tus atamalari — metin girisi, escape ile normal moda donus

/**
 * Register insert mode keybindings
 * Insert mod tus atamalarini kaydet
 */
export function registerInsertMode() {
    const set = (key, command, args) => {
        // Bind key in insert mode keymap
        // Insert mod tus haritasina tus ata
        if (args) {
            editor.keymaps.set("insert", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("insert", key, command);
        }
    };

    // ── Exit insert mode ────────────────────────────────────────
    // ── Insert modundan cik ─────────────────────────────────────
    set("Escape", "mode.set", { mode: "normal" });

    // NOTE: Basic text input (typing characters) is handled by the editor core.
    // NOT: Temel metin girisi (karakter yazimi) editor cekirdegi tarafindan islenir.

    // ── Word-level editing shortcuts ────────────────────────────
    // ── Kelime duzeyi duzenleme kisayollari ─────────────────────
    set("C-w", "vim.deleteWordBackward");
    set("C-u", "vim.deleteToLineStart");

    // ── Additional insert mode helpers ──────────────────────────
    // ── Ek insert mod yardimcilari ──────────────────────────────
    set("C-h", "input.key", { key: "Backspace" });
    set("C-t", "indent.increase");
    set("C-d", "indent.decrease");

    // ── Completion trigger ──────────────────────────────────────
    // ── Tamamlama tetikleyici ───────────────────────────────────
    set("C-n", "vim.completionNext");
    set("C-p", "vim.completionPrev");

    console.log("[vim-mode] Insert mode keybindings registered");
}
