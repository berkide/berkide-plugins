// Vim normal mode keybindings — movement, operators, search, mode switches
// Vim normal mod tus atamalari — hareket, operatorler, arama, mod gecisleri

/**
 * Register all normal mode keybindings
 * Tum normal mod tus atamalarini kaydet
 */
export function registerNormalMode() {
    const set = (key, command, args) => {
        // Bind key in normal mode keymap
        // Normal mod tus haritasina tus ata
        if (args) {
            editor.keymaps.set("normal", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("normal", key, command);
        }
    };

    // ── Basic movement ──────────────────────────────────────────
    // ── Temel hareket ───────────────────────────────────────────
    set("h", "cursor.left");
    set("j", "cursor.down");
    set("k", "cursor.up");
    set("l", "cursor.right");

    // ── Word motions ────────────────────────────────────────────
    // ── Kelime hareketleri ──────────────────────────────────────
    set("w", "vim.wordForward");
    set("e", "vim.wordEnd");
    set("b", "vim.wordBackward");

    // ── Line start / end ────────────────────────────────────────
    // ── Satir basi / sonu ───────────────────────────────────────
    set("0", "cursor.home");
    set("$", "cursor.end");
    set("^", "vim.firstNonBlank");

    // ── Document start / end ────────────────────────────────────
    // ── Belge basi / sonu ───────────────────────────────────────
    set("gg", "vim.documentStart");
    set("G", "vim.documentEnd");

    // ── Find char motions ───────────────────────────────────────
    // ── Karakter bulma hareketleri ──────────────────────────────
    set("f", "vim.findChar", { direction: "forward", inclusive: true });
    set("t", "vim.tillChar", { direction: "forward", inclusive: false });
    set("F", "vim.findChar", { direction: "backward", inclusive: true });
    set("T", "vim.tillChar", { direction: "backward", inclusive: false });

    // ── Enter insert mode ───────────────────────────────────────
    // ── Insert moduna gec ───────────────────────────────────────
    set("i", "mode.set", { mode: "insert" });
    set("a", "mode.set", { mode: "insert", after: true });
    set("I", "mode.set", { mode: "insert", lineStart: true });
    set("A", "mode.set", { mode: "insert", lineEnd: true });
    set("o", "mode.set", { mode: "insert", newLineBelow: true });
    set("O", "mode.set", { mode: "insert", newLineAbove: true });

    // ── Delete / yank / paste ───────────────────────────────────
    // ── Silme / kopyalama / yapistirma ──────────────────────────
    set("dd", "edit.deleteLine");
    set("yy", "vim.yankLine");
    set("p", "vim.pasteAfter");
    set("P", "vim.pasteBefore");

    // ── Single char operations ──────────────────────────────────
    // ── Tek karakter islemleri ───────────────────────────────────
    set("x", "vim.deleteChar");
    set("r", "vim.replaceChar");

    // ── Undo / redo ─────────────────────────────────────────────
    // ── Geri al / yinele ────────────────────────────────────────
    set("u", "edit.undo");
    set("C-r", "edit.redo");

    // ── Search ──────────────────────────────────────────────────
    // ── Arama ───────────────────────────────────────────────────
    set("/", "search.forward");
    set("?", "search.backward");
    set("n", "search.next");
    set("N", "search.prev");
    set("*", "vim.searchWordForward");
    set("#", "vim.searchWordBackward");

    // ── Visual mode switches ────────────────────────────────────
    // ── Visual mod gecisleri ────────────────────────────────────
    set("v", "mode.set", { mode: "visual" });
    set("V", "mode.set", { mode: "visual-line" });

    // ── Command mode ────────────────────────────────────────────
    // ── Komut modu ──────────────────────────────────────────────
    set(":", "vim.commandMode");

    // ── Repeat last command ─────────────────────────────────────
    // ── Son komutu tekrarla ─────────────────────────────────────
    set(".", "vim.repeatLast");

    // ── Join lines ──────────────────────────────────────────────
    // ── Satirlari birlestir ─────────────────────────────────────
    set("J", "buffer.joinLines");

    // ── Scroll ──────────────────────────────────────────────────
    // ── Kaydirma ────────────────────────────────────────────────
    set("C-d", "vim.scrollHalfDown");
    set("C-u", "vim.scrollHalfUp");
    set("C-f", "vim.scrollPageDown");
    set("C-b", "vim.scrollPageUp");

    // ── Marks ───────────────────────────────────────────────────
    // ── Isaretler ───────────────────────────────────────────────
    set("m", "vim.setMark");
    set("'", "vim.jumpToMark");
    set("`", "vim.jumpToMarkExact");

    console.log("[vim-mode] Normal mode keybindings registered");
}
