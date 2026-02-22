// Emacs mode plugin — C-x prefix, M-x commands, kill ring, region operations
// Emacs modu eklentisi — C-x oneki, M-x komutlari, kill ring, bolge islemleri

// Kill ring state for yank cycling
// Yank dongusu icin kill ring durumu
let killRing = [];
let killRingIndex = -1;
const KILL_RING_MAX = 60;

/**
 * Push text to the kill ring
 * Kill ring'e metin ekle
 */
function killRingPush(text) {
    killRing.push(text);
    if (killRing.length > KILL_RING_MAX) {
        killRing.shift();
    }
    killRingIndex = killRing.length - 1;

    // Also store in register "1" for cross-system access
    // Sistemler arasi erisim icin register "1"e de kaydet
    editor.commands.exec("registers.set", { name: "1", value: text });
}

/**
 * Get current kill ring entry
 * Mevcut kill ring girisini al
 */
function killRingTop() {
    if (killRing.length === 0) return "";
    return killRing[killRingIndex];
}

export function activate() {

    const set = (key, command, args) => {
        // Bind key in emacs mode keymap
        // Emacs mod tus haritasina tus ata
        if (args) {
            editor.keymaps.set("emacs", key, command, JSON.stringify(args));
        } else {
            editor.keymaps.set("emacs", key, command);
        }
    };

    // ══════════════════════════════════════════════════════════════
    //  Register emacs-specific JS commands first
    //  Once emacs'a ozel JS komutlarini kaydet
    // ══════════════════════════════════════════════════════════════

    // ── Word movement ─────────────────────────────────────────────
    // ── Kelime hareketi ───────────────────────────────────────────
    editor.commands.register("emacs.wordForward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.nextWordStart", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    editor.commands.register("emacs.wordBackward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.prevWordStart", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    // ── Document start / end ──────────────────────────────────────
    // ── Belge basi / sonu ─────────────────────────────────────────
    editor.commands.register("emacs.documentStart", () => {
        editor.commands.exec("cursor.setPosition", { line: 0, col: 0 });
    });

    editor.commands.register("emacs.documentEnd", () => {
        const count = editor.commands.exec("buffer.lineCount");
        const lastLine = (count && count.count) ? count.count - 1 : 0;
        const colCount = editor.commands.exec("buffer.columnCount", { line: lastLine });
        const lastCol = (colCount && colCount.count) ? colCount.count : 0;
        editor.commands.exec("cursor.setPosition", { line: lastLine, col: lastCol });
    });

    // ── Page scroll ───────────────────────────────────────────────
    // ── Sayfa kaydirma ────────────────────────────────────────────
    editor.commands.register("emacs.pageDown", () => {
        for (let i = 0; i < 30; i++) editor.commands.exec("cursor.down");
    });

    editor.commands.register("emacs.pageUp", () => {
        for (let i = 0; i < 30; i++) editor.commands.exec("cursor.up");
    });

    // ── emacs.setMark ─────────────────────────────────────────────
    // ── Isaret koy ────────────────────────────────────────────────
    editor.commands.register("emacs.setMark", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        editor.commands.exec("mark.set", { name: "emacs-mark" });
        editor.commands.exec("selection.setAnchor", pos);
        console.log("[emacs-mode] Mark set at " + pos.line + ":" + pos.col);
    });

    // ── emacs.exchangePointAndMark ────────────────────────────────
    // ── Imlec ve isareti degistir ─────────────────────────────────
    editor.commands.register("emacs.exchangePointAndMark", () => {
        const markData = editor.commands.exec("marks.get", { name: "emacs-mark" });
        if (!markData || markData.line === undefined) return;

        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;

        editor.commands.exec("cursor.setPosition", { line: markData.line, col: markData.col });
        editor.commands.exec("mark.set", { name: "emacs-mark" });
    });

    // ── emacs.killRegion ──────────────────────────────────────────
    // ── Bolgeyi kes (C-w) ─────────────────────────────────────────
    editor.commands.register("emacs.killRegion", () => {
        const sel = editor.commands.exec("selection.getText");
        if (sel && sel.text) {
            killRingPush(sel.text);
            editor.commands.exec("edit.cut");
        }
    });

    // ── emacs.copyRegion ──────────────────────────────────────────
    // ── Bolgeyi kopyala (M-w) ─────────────────────────────────────
    editor.commands.register("emacs.copyRegion", () => {
        const sel = editor.commands.exec("selection.getText");
        if (sel && sel.text) {
            killRingPush(sel.text);
            editor.commands.exec("selection.clear");
        }
    });

    // ── emacs.yank ────────────────────────────────────────────────
    // ── Kill ring'den yapistir (C-y) ──────────────────────────────
    editor.commands.register("emacs.yank", () => {
        const text = killRingTop();
        if (text) {
            const pos = editor.commands.exec("cursor.getPosition");
            if (pos) {
                editor.commands.exec("buffer.insert", {
                    line: pos.line, col: pos.col, text: text
                });
            }
        }
    });

    // ── emacs.yankPop ─────────────────────────────────────────────
    // ── Kill ring'de onceki girisi yapistir (M-y) ─────────────────
    editor.commands.register("emacs.yankPop", () => {
        if (killRing.length === 0) return;

        // Cycle backward through kill ring
        // Kill ring'de geriye dogru don
        killRingIndex = (killRingIndex - 1 + killRing.length) % killRing.length;

        editor.commands.exec("edit.undo");
        const text = killRingTop();
        if (text) {
            const pos = editor.commands.exec("cursor.getPosition");
            if (pos) {
                editor.commands.exec("buffer.insert", {
                    line: pos.line, col: pos.col, text: text
                });
            }
        }
    });

    // ── emacs.killLine ────────────────────────────────────────────
    // ── Satir sonuna kadar kes (C-k) ──────────────────────────────
    editor.commands.register("emacs.killLine", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const lineData = editor.commands.exec("buffer.getLine", { line: pos.line });
        if (!lineData || lineData.text === undefined) return;

        if (pos.col >= lineData.text.length) {
            // At end of line — join with next line
            // Satir sonunda — sonraki satir ile birlestir
            killRingPush("\n");
            editor.commands.exec("buffer.joinLines", { line: pos.line });
        } else {
            // Kill from cursor to end of line
            // Imlecten satir sonuna kadar kes
            const killed = lineData.text.substring(pos.col);
            killRingPush(killed);
            editor.commands.exec("buffer.deleteRange", {
                startLine: pos.line, startCol: pos.col,
                endLine: pos.line, endCol: lineData.text.length
            });
        }
    });

    // ── emacs.deleteWordForward ───────────────────────────────────
    // ── Imlecten sonraki kelimeyi sil (M-d) ───────────────────────
    editor.commands.register("emacs.deleteWordForward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const wordEnd = editor.commands.exec("chars.wordEnd", {
            line: pos.line, col: pos.col
        });
        if (wordEnd && wordEnd.col !== undefined) {
            editor.commands.exec("buffer.deleteRange", {
                startLine: pos.line, startCol: pos.col,
                endLine: wordEnd.line || pos.line, endCol: wordEnd.col + 1
            });
        }
    });

    // ── emacs.deleteWordBackward ──────────────────────────────────
    // ── Imlecten onceki kelimeyi sil (M-Backspace) ────────────────
    editor.commands.register("emacs.deleteWordBackward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos || pos.col <= 0) return;
        const wordStart = editor.commands.exec("chars.prevWordStart", {
            line: pos.line, col: pos.col
        });
        if (wordStart && wordStart.col !== undefined) {
            editor.commands.exec("buffer.deleteRange", {
                startLine: wordStart.line || pos.line, startCol: wordStart.col,
                endLine: pos.line, endCol: pos.col
            });
        }
    });

    // ── emacs.transposeChars ──────────────────────────────────────
    // ── Imlec etrafindaki iki karakteri degistir (C-t) ────────────
    editor.commands.register("emacs.transposeChars", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos || pos.col <= 0) return;
        const lineData = editor.commands.exec("buffer.getLine", { line: pos.line });
        if (!lineData || !lineData.text || pos.col >= lineData.text.length) return;

        const a = lineData.text[pos.col - 1];
        const b = lineData.text[pos.col];

        editor.commands.exec("edit.beginGroup");
        editor.commands.exec("buffer.delete", { line: pos.line, col: pos.col - 1 });
        editor.commands.exec("buffer.delete", { line: pos.line, col: pos.col - 1 });
        editor.commands.exec("buffer.insert", { line: pos.line, col: pos.col - 1, text: b + a });
        editor.commands.exec("edit.endGroup");
        editor.commands.exec("cursor.setPosition", { line: pos.line, col: pos.col + 1 });
    });

    // ── emacs.transposeWords ──────────────────────────────────────
    // ── Imlec etrafindaki iki kelimeyi degistir (M-t) ─────────────
    editor.commands.register("emacs.transposeWords", () => {
        // Simplified: emit event for more complex implementations
        // Basitlestirilmis: daha karmasik uygulamalar icin olay yayinla
        editor.events.emit("emacs.transposeWords");
    });

    // ── Case conversion ───────────────────────────────────────────
    // ── Buyuk/kucuk harf donusumu ─────────────────────────────────
    editor.commands.register("emacs.uppercaseWord", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const word = editor.commands.exec("chars.wordAt", { line: pos.line, col: pos.col });
        if (!word || !word.word) return;

        editor.commands.exec("edit.beginGroup");
        editor.commands.exec("buffer.deleteRange", {
            startLine: pos.line, startCol: word.start,
            endLine: pos.line, endCol: word.end
        });
        editor.commands.exec("buffer.insert", {
            line: pos.line, col: word.start, text: word.word.toUpperCase()
        });
        editor.commands.exec("edit.endGroup");
    });

    editor.commands.register("emacs.lowercaseWord", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const word = editor.commands.exec("chars.wordAt", { line: pos.line, col: pos.col });
        if (!word || !word.word) return;

        editor.commands.exec("edit.beginGroup");
        editor.commands.exec("buffer.deleteRange", {
            startLine: pos.line, startCol: word.start,
            endLine: pos.line, endCol: word.end
        });
        editor.commands.exec("buffer.insert", {
            line: pos.line, col: word.start, text: word.word.toLowerCase()
        });
        editor.commands.exec("edit.endGroup");
    });

    editor.commands.register("emacs.capitalizeWord", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const word = editor.commands.exec("chars.wordAt", { line: pos.line, col: pos.col });
        if (!word || !word.word) return;

        const capitalized = word.word.charAt(0).toUpperCase() + word.word.slice(1).toLowerCase();
        editor.commands.exec("edit.beginGroup");
        editor.commands.exec("buffer.deleteRange", {
            startLine: pos.line, startCol: word.start,
            endLine: pos.line, endCol: word.end
        });
        editor.commands.exec("buffer.insert", {
            line: pos.line, col: word.start, text: capitalized
        });
        editor.commands.exec("edit.endGroup");
    });

    // ── emacs.executeExtendedCommand ──────────────────────────────
    // ── M-x komut paleti ──────────────────────────────────────────
    editor.commands.register("emacs.executeExtendedCommand", () => {
        editor.events.emit("ui.commandPalette", { prefix: "M-x " });
    });

    // ── emacs.cancel ──────────────────────────────────────────────
    // ── Iptal et (C-g) ────────────────────────────────────────────
    editor.commands.register("emacs.cancel", () => {
        editor.commands.exec("selection.clear");
        editor.commands.exec("multicursor.clear");
        editor.events.emit("ui.cancel");
        console.log("[emacs-mode] Quit");
    });

    // ── emacs.universalArgument ───────────────────────────────────
    // ── Evrensel arguman (C-u) ────────────────────────────────────
    editor.commands.register("emacs.universalArgument", () => {
        editor.events.emit("emacs.universalArgument", { multiplier: 4 });
    });

    // ── Buffer operations ─────────────────────────────────────────
    // ── Buffer islemleri ──────────────────────────────────────────
    editor.commands.register("emacs.bufferSwitch", () => {
        editor.events.emit("ui.bufferList", { action: "switch" });
    });

    editor.commands.register("emacs.bufferKill", () => {
        editor.commands.exec("tab.close");
    });

    editor.commands.register("emacs.bufferList", () => {
        editor.events.emit("ui.bufferList", { action: "list" });
    });

    // ── Window only — close all other windows ─────────────────────
    // ── Sadece bu pencere — diger tum pencereleri kapat ───────────
    editor.commands.register("emacs.windowOnly", () => {
        const count = editor.commands.exec("windows.count");
        if (!count || count.count <= 1) return;
        // Close all windows except active
        // Aktif pencere haricinde tumunu kapat
        for (let i = count.count - 1; i > 0; i--) {
            editor.commands.exec("window.close");
        }
    });

    // ══════════════════════════════════════════════════════════════
    //  Keybindings
    //  Tus atamalari
    // ══════════════════════════════════════════════════════════════

    // ── Basic movement ──────────────────────────────────────────
    // ── Temel hareket ───────────────────────────────────────────
    set("C-f", "cursor.right");
    set("C-b", "cursor.left");
    set("C-n", "cursor.down");
    set("C-p", "cursor.up");

    // ── Line start / end ────────────────────────────────────────
    // ── Satir basi / sonu ───────────────────────────────────────
    set("C-a", "cursor.home");
    set("C-e", "cursor.end");

    // ── Word movement ───────────────────────────────────────────
    // ── Kelime hareketi ─────────────────────────────────────────
    set("M-f", "emacs.wordForward");
    set("M-b", "emacs.wordBackward");

    // ── Page scrolling ──────────────────────────────────────────
    // ── Sayfa kaydirma ──────────────────────────────────────────
    set("C-v", "emacs.pageDown");
    set("M-v", "emacs.pageUp");

    // ── Document start / end ────────────────────────────────────
    // ── Belge basi / sonu ───────────────────────────────────────
    set("M-<", "emacs.documentStart");
    set("M->", "emacs.documentEnd");

    // ── Mark and region ─────────────────────────────────────────
    // ── Isaret ve bolge ─────────────────────────────────────────
    set("C-space", "emacs.setMark");
    set("C-x C-x", "emacs.exchangePointAndMark");

    // ── Kill / copy / yank (using kill ring) ────────────────────
    // ── Kes / kopyala / yapistir (kill ring ile) ────────────────
    set("C-w", "emacs.killRegion");
    set("M-w", "emacs.copyRegion");
    set("C-y", "emacs.yank");
    set("M-y", "emacs.yankPop");

    // ── Kill line ───────────────────────────────────────────────
    // ── Satir sonuna kadar kes ──────────────────────────────────
    set("C-k", "emacs.killLine");

    // ── Delete ──────────────────────────────────────────────────
    // ── Silme ───────────────────────────────────────────────────
    set("C-d", "input.key", { key: "Delete" });
    set("M-d", "emacs.deleteWordForward");
    set("M-Backspace", "emacs.deleteWordBackward");

    // ── File operations (C-x prefix) ────────────────────────────
    // ── Dosya islemleri (C-x oneki) ─────────────────────────────
    set("C-x C-s", "file.save");
    set("C-x C-f", "file.open");
    set("C-x C-c", "app.quit");
    set("C-x C-w", "file.saveAs");

    // ── Buffer operations (C-x prefix) ──────────────────────────
    // ── Buffer islemleri (C-x oneki) ────────────────────────────
    set("C-x b", "emacs.bufferSwitch");
    set("C-x k", "emacs.bufferKill");
    set("C-x C-b", "emacs.bufferList");

    // ── Window operations (C-x prefix) ──────────────────────────
    // ── Pencere islemleri (C-x oneki) ───────────────────────────
    set("C-x 2", "window.splitH");
    set("C-x 3", "window.splitV");
    set("C-x 0", "window.close");
    set("C-x 1", "emacs.windowOnly");
    set("C-x o", "window.focusNext");

    // ── Search ──────────────────────────────────────────────────
    // ── Arama ───────────────────────────────────────────────────
    set("C-s", "search.forward");
    set("C-r", "search.backward");
    set("M-%", "search.replace");

    // ── M-x command palette ─────────────────────────────────────
    // ── M-x komut paleti ────────────────────────────────────────
    set("M-x", "emacs.executeExtendedCommand");

    // ── Cancel / universal argument ─────────────────────────────
    // ── Iptal / evrensel arguman ────────────────────────────────
    set("C-g", "emacs.cancel");
    set("C-u", "emacs.universalArgument");

    // ── Undo ────────────────────────────────────────────────────
    // ── Geri al ─────────────────────────────────────────────────
    set("C-/", "edit.undo");
    set("C-x u", "edit.undo");

    // ── Transpose ───────────────────────────────────────────────
    // ── Yer degistirme ──────────────────────────────────────────
    set("C-t", "emacs.transposeChars");
    set("M-t", "emacs.transposeWords");

    // ── Case conversion ─────────────────────────────────────────
    // ── Buyuk/kucuk harf donusumu ───────────────────────────────
    set("M-u", "emacs.uppercaseWord");
    set("M-l", "emacs.lowercaseWord");
    set("M-c", "emacs.capitalizeWord");

    // ── Indent ──────────────────────────────────────────────────
    // ── Girintileme ─────────────────────────────────────────────
    set("Tab", "indent.increase");
    set("C-M-\\", "indent.reindent");

    // Set mode to emacs
    // Modu emacs olarak ayarla
    editor.commands.exec("mode.set", { mode: "emacs" });

    console.log("[emacs-mode] Emacs keybindings activated — C-x prefix, M-x commands, kill ring ready");
}

export function deactivate() {
    // Cleanup keymaps and commands on deactivation
    // Deaktivasyon sirasinda tus haritalarini ve komutlari temizle
    killRing = [];
    killRingIndex = -1;
    console.log("[emacs-mode] Emacs mode deactivated");
}
