// Vim visual mode keybindings — selection with motions, operators on selection
// Vim visual mod tus atamalari — hareketlerle secim, secim uzerinde operatorler

/**
 * Register visual mode keybindings
 * Visual mod tus atamalarini kaydet
 */
export function registerVisualMode() {
    const set = (key, command, args) => {
        // Bind key in visual mode keymap
        // Visual mod tus haritasina tus ata
        if (args) {
            editor.keymaps.set("visual", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("visual", key, command);
        }
    };

    // ── Movement (extends selection) ────────────────────────────
    // ── Hareket (secimi genisletir) ─────────────────────────────
    set("h", "vim.extendLeft");
    set("j", "vim.extendDown");
    set("k", "vim.extendUp");
    set("l", "vim.extendRight");

    // ── Word motions (extend selection) ─────────────────────────
    // ── Kelime hareketleri (secimi genisletir) ──────────────────
    set("w", "vim.extendWordForward");
    set("e", "vim.extendWordEnd");
    set("b", "vim.extendWordBackward");

    // ── Line start / end (extend selection) ─────────────────────
    // ── Satir basi / sonu (secimi genisletir) ───────────────────
    set("0", "vim.extendLineStart");
    set("$", "vim.extendLineEnd");
    set("^", "vim.extendFirstNonBlank");

    // ── Document start / end (extend selection) ─────────────────
    // ── Belge basi / sonu (secimi genisletir) ───────────────────
    set("gg", "vim.extendDocumentStart");
    set("G", "vim.extendDocumentEnd");

    // ── Operators on selection ───────────────────────────────────
    // ── Secim uzerinde operatorler ──────────────────────────────
    set("d", "vim.visualDelete");
    set("x", "vim.visualDelete");
    set("y", "vim.visualYank");
    set("c", "vim.visualChange");

    // ── Indent / dedent selection ───────────────────────────────
    // ── Secimi girintile / girintiyi kaldir ─────────────────────
    set(">", "indent.increase");
    set("<", "indent.decrease");

    // ── Case toggle ─────────────────────────────────────────────
    // ── Buyuk/kucuk harf degistir ───────────────────────────────
    set("~", "vim.toggleCase");
    set("U", "vim.toUpperCase");
    set("u", "vim.toLowerCase");

    // ── Switch between visual modes ─────────────────────────────
    // ── Visual modlar arasi gecis ───────────────────────────────
    set("v", "mode.set", { mode: "visual" });
    set("V", "mode.set", { mode: "visual-line" });

    // ── Exit visual mode ────────────────────────────────────────
    // ── Visual moddan cik ───────────────────────────────────────
    set("Escape", "mode.set", { mode: "normal" });

    // ── Join selected lines ─────────────────────────────────────
    // ── Secili satirlari birlestir ──────────────────────────────
    set("J", "buffer.joinLines");

    // ── Reselect last selection ─────────────────────────────────
    // ── Son secimi tekrar sec ───────────────────────────────────
    set("gv", "vim.reselect");

    console.log("[vim-mode] Visual mode keybindings registered");
}
