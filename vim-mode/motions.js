// Vim motion and helper commands — word movement, find/till, scroll, yank/paste, search
// Vim hareket ve yardimci komutlari — kelime hareketi, bul/git, kaydirma, kopyala/yapistir, arama

/**
 * Register vim-specific commands (both motions and operations)
 * Vim'e ozel komutlari kaydet (hem hareketler hem islemler)
 */
export function registerMotions() {

    // ══════════════════════════════════════════════════════════════
    //  Word motions
    //  Kelime hareketleri
    // ══════════════════════════════════════════════════════════════

    // vim.wordForward — move to next word start (w)
    // Sonraki kelimenin basina git
    editor.commands.register("vim.wordForward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.nextWordStart", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    // vim.wordBackward — move to previous word start (b)
    // Onceki kelimenin basina git
    editor.commands.register("vim.wordBackward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.prevWordStart", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    // vim.wordEnd — move to current/next word end (e)
    // Mevcut/sonraki kelimenin sonuna git
    editor.commands.register("vim.wordEnd", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const result = editor.commands.exec("chars.wordEnd", {
            line: pos.line, col: pos.col
        });
        if (result && result.line !== undefined) {
            editor.commands.exec("cursor.setPosition", result);
        }
    });

    // ══════════════════════════════════════════════════════════════
    //  Line / document motions
    //  Satir / belge hareketleri
    // ══════════════════════════════════════════════════════════════

    // vim.firstNonBlank — move to first non-whitespace char (^)
    // Ilk bosluk olmayan karaktere git
    editor.commands.register("vim.firstNonBlank", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const lineData = editor.commands.exec("buffer.getLine", { line: pos.line });
        if (!lineData || !lineData.text) return;
        const match = lineData.text.match(/\S/);
        editor.commands.exec("cursor.setPosition", {
            line: pos.line,
            col: match ? match.index : 0
        });
    });

    // vim.documentStart — go to first line (gg)
    // Ilk satira git
    editor.commands.register("vim.documentStart", () => {
        editor.commands.exec("cursor.setPosition", { line: 0, col: 0 });
    });

    // vim.documentEnd — go to last line (G)
    // Son satira git
    editor.commands.register("vim.documentEnd", () => {
        const count = editor.commands.exec("buffer.lineCount");
        const lastLine = (count && count.count) ? count.count - 1 : 0;
        editor.commands.exec("cursor.setPosition", { line: lastLine, col: 0 });
    });

    // ══════════════════════════════════════════════════════════════
    //  Scroll commands
    //  Kaydirma komutlari
    // ══════════════════════════════════════════════════════════════

    // Half page scroll (C-d / C-u)
    // Yarim sayfa kaydirma
    editor.commands.register("vim.scrollHalfDown", () => {
        for (let i = 0; i < 15; i++) editor.commands.exec("cursor.down");
    });

    editor.commands.register("vim.scrollHalfUp", () => {
        for (let i = 0; i < 15; i++) editor.commands.exec("cursor.up");
    });

    // Full page scroll (C-f / C-b)
    // Tam sayfa kaydirma
    editor.commands.register("vim.scrollPageDown", () => {
        for (let i = 0; i < 30; i++) editor.commands.exec("cursor.down");
    });

    editor.commands.register("vim.scrollPageUp", () => {
        for (let i = 0; i < 30; i++) editor.commands.exec("cursor.up");
    });

    // ══════════════════════════════════════════════════════════════
    //  Char operations
    //  Karakter islemleri
    // ══════════════════════════════════════════════════════════════

    // vim.deleteChar — delete char under cursor (x)
    // Imlec altindaki karakteri sil
    editor.commands.register("vim.deleteChar", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        editor.commands.exec("buffer.delete", { line: pos.line, col: pos.col });
    });

    // vim.findChar — find character on current line (f/F)
    // Mevcut satirda karakter bul
    editor.commands.register("vim.findChar", (args) => {
        const direction = args.direction || "forward";
        const inclusive = args.inclusive !== undefined ? args.inclusive : true;

        // Wait for next char input via event
        // Sonraki karakter girisini olay ile bekle
        editor.events.emit("vim.awaitChar", {
            callback: (ch) => {
                const pos = editor.commands.exec("cursor.getPosition");
                if (!pos) return;
                const lineData = editor.commands.exec("buffer.getLine", { line: pos.line });
                if (!lineData || !lineData.text) return;
                const line = lineData.text;

                if (direction === "forward") {
                    for (let i = pos.col + 1; i < line.length; i++) {
                        if (line[i] === ch) {
                            editor.commands.exec("cursor.setPosition", {
                                line: pos.line, col: inclusive ? i : i - 1
                            });
                            return;
                        }
                    }
                } else {
                    for (let i = pos.col - 1; i >= 0; i--) {
                        if (line[i] === ch) {
                            editor.commands.exec("cursor.setPosition", {
                                line: pos.line, col: inclusive ? i : i + 1
                            });
                            return;
                        }
                    }
                }
            }
        });
    });

    // vim.tillChar — move till character (t/T) — delegates to findChar
    // Karaktere kadar git ama uzerine gelme
    editor.commands.register("vim.tillChar", (args) => {
        editor.commands.exec("vim.findChar", {
            direction: args.direction || "forward",
            inclusive: false
        });
    });

    // vim.replaceChar — replace char under cursor (r)
    // Imlec altindaki karakteri degistir
    editor.commands.register("vim.replaceChar", () => {
        editor.events.emit("vim.awaitChar", {
            callback: (ch) => {
                const pos = editor.commands.exec("cursor.getPosition");
                if (!pos) return;
                editor.commands.exec("buffer.delete", { line: pos.line, col: pos.col });
                editor.commands.exec("buffer.insert", { line: pos.line, col: pos.col, text: ch });
            }
        });
    });

    // ══════════════════════════════════════════════════════════════
    //  Yank / paste / delete line
    //  Kopyala / yapistir / satir sil
    // ══════════════════════════════════════════════════════════════

    // vim.yankLine — copy current line to register (yy)
    // Mevcut satiri registere kopyala
    editor.commands.register("vim.yankLine", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const lineData = editor.commands.exec("buffer.getLine", { line: pos.line });
        if (lineData && lineData.text !== undefined) {
            editor.commands.exec("registers.set", { name: "0", value: lineData.text + "\n" });
        }
    });

    // vim.pasteAfter — paste from register after cursor (p)
    // Registerdan imlecten sonraya yapistir
    editor.commands.register("vim.pasteAfter", () => {
        const reg = editor.commands.exec("registers.get", { name: "0" });
        if (!reg || !reg.value) return;
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;

        if (reg.value.endsWith("\n")) {
            // Line-wise paste — insert as new line below
            // Satir bazli yapistirma — asagiya yeni satir olarak ekle
            const text = reg.value.replace(/\n$/, "");
            editor.commands.exec("buffer.insertLine", { line: pos.line + 1, text: text });
            editor.commands.exec("cursor.setPosition", { line: pos.line + 1, col: 0 });
        } else {
            editor.commands.exec("buffer.insert", {
                line: pos.line, col: pos.col + 1, text: reg.value
            });
        }
    });

    // vim.pasteBefore — paste from register before cursor (P)
    // Registerdan imlecten oncesine yapistir
    editor.commands.register("vim.pasteBefore", () => {
        const reg = editor.commands.exec("registers.get", { name: "0" });
        if (!reg || !reg.value) return;
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;

        if (reg.value.endsWith("\n")) {
            const text = reg.value.replace(/\n$/, "");
            editor.commands.exec("buffer.insertLine", { line: pos.line, text: text });
        } else {
            editor.commands.exec("buffer.insert", {
                line: pos.line, col: pos.col, text: reg.value
            });
        }
    });

    // ══════════════════════════════════════════════════════════════
    //  Insert mode helpers
    //  Insert mod yardimcilari
    // ══════════════════════════════════════════════════════════════

    // vim.deleteWordBackward — delete word before cursor (C-w in insert)
    // Imlecten onceki kelimeyi sil
    editor.commands.register("vim.deleteWordBackward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos || pos.col <= 0) return;
        const wordStart = editor.commands.exec("chars.prevWordStart", {
            line: pos.line, col: pos.col
        });
        if (wordStart && wordStart.col !== undefined) {
            editor.commands.exec("buffer.deleteRange", {
                startLine: pos.line, startCol: wordStart.col,
                endLine: pos.line, endCol: pos.col
            });
        }
    });

    // vim.deleteToLineStart — delete from cursor to line start (C-u in insert)
    // Imlecten satir basina kadar sil
    editor.commands.register("vim.deleteToLineStart", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos || pos.col <= 0) return;
        editor.commands.exec("buffer.deleteRange", {
            startLine: pos.line, startCol: 0,
            endLine: pos.line, endCol: pos.col
        });
    });

    // ══════════════════════════════════════════════════════════════
    //  Search word under cursor
    //  Imlec altindaki kelimeyi ara
    // ══════════════════════════════════════════════════════════════

    // vim.searchWordForward — search word under cursor forward (*)
    // Imlec altindaki kelimeyi ileriye ara
    editor.commands.register("vim.searchWordForward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const word = editor.commands.exec("chars.wordAt", { line: pos.line, col: pos.col });
        if (word && word.word) {
            editor.commands.exec("search.forward", { pattern: "\\b" + word.word + "\\b" });
        }
    });

    // vim.searchWordBackward — search word under cursor backward (#)
    // Imlec altindaki kelimeyi geriye ara
    editor.commands.register("vim.searchWordBackward", () => {
        const pos = editor.commands.exec("cursor.getPosition");
        if (!pos) return;
        const word = editor.commands.exec("chars.wordAt", { line: pos.line, col: pos.col });
        if (word && word.word) {
            editor.commands.exec("search.backward", { pattern: "\\b" + word.word + "\\b" });
        }
    });

    // ══════════════════════════════════════════════════════════════
    //  Visual mode operations
    //  Visual mod islemleri
    // ══════════════════════════════════════════════════════════════

    // Selection extension helpers — ensure anchor is set, then move
    // Secim genisletme yardimcilari — capanin ayarlandiginden emin ol, sonra tasi
    const extendWith = (moveCmd) => {
        const sel = editor.commands.exec("selection.isActive");
        if (!sel || !sel.active) {
            const pos = editor.commands.exec("cursor.getPosition");
            if (pos) editor.commands.exec("selection.setAnchor", pos);
        }
        editor.commands.exec(moveCmd);
    };

    editor.commands.register("vim.extendLeft", () => extendWith("cursor.left"));
    editor.commands.register("vim.extendRight", () => extendWith("cursor.right"));
    editor.commands.register("vim.extendUp", () => extendWith("cursor.up"));
    editor.commands.register("vim.extendDown", () => extendWith("cursor.down"));
    editor.commands.register("vim.extendWordForward", () => extendWith("vim.wordForward"));
    editor.commands.register("vim.extendWordEnd", () => extendWith("vim.wordEnd"));
    editor.commands.register("vim.extendWordBackward", () => extendWith("vim.wordBackward"));
    editor.commands.register("vim.extendLineStart", () => extendWith("cursor.home"));
    editor.commands.register("vim.extendLineEnd", () => extendWith("cursor.end"));
    editor.commands.register("vim.extendFirstNonBlank", () => extendWith("vim.firstNonBlank"));
    editor.commands.register("vim.extendDocumentStart", () => extendWith("vim.documentStart"));
    editor.commands.register("vim.extendDocumentEnd", () => extendWith("vim.documentEnd"));

    // Visual delete — yank selection, delete it, return to normal mode
    // Visual silme — secimi kopyala, sil, normal moda don
    editor.commands.register("vim.visualDelete", () => {
        const text = editor.commands.exec("selection.getText");
        if (text && text.text) {
            editor.commands.exec("registers.set", { name: "0", value: text.text });
        }
        editor.commands.exec("edit.cut");
        editor.commands.exec("mode.set", { mode: "normal" });
    });

    // Visual yank — copy selection, return to normal mode
    // Visual kopyalama — secimi kopyala, normal moda don
    editor.commands.register("vim.visualYank", () => {
        const text = editor.commands.exec("selection.getText");
        if (text && text.text) {
            editor.commands.exec("registers.set", { name: "0", value: text.text });
        }
        editor.commands.exec("selection.clear");
        editor.commands.exec("mode.set", { mode: "normal" });
    });

    // Visual change — delete selection, enter insert mode
    // Visual degistirme — secimi sil, insert moduna gec
    editor.commands.register("vim.visualChange", () => {
        const text = editor.commands.exec("selection.getText");
        if (text && text.text) {
            editor.commands.exec("registers.set", { name: "0", value: text.text });
        }
        editor.commands.exec("edit.cut");
        editor.commands.exec("mode.set", { mode: "insert" });
    });

    // Case operations on selection
    // Secim uzerinde buyuk/kucuk harf islemleri
    editor.commands.register("vim.toggleCase", () => {
        const text = editor.commands.exec("selection.getText");
        if (!text || !text.text) return;
        const toggled = text.text.split("").map(c =>
            c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        ).join("");
        editor.commands.exec("edit.cut");
        const pos = editor.commands.exec("cursor.getPosition");
        if (pos) editor.commands.exec("buffer.insert", { line: pos.line, col: pos.col, text: toggled });
        editor.commands.exec("mode.set", { mode: "normal" });
    });

    editor.commands.register("vim.toUpperCase", () => {
        const text = editor.commands.exec("selection.getText");
        if (!text || !text.text) return;
        editor.commands.exec("edit.cut");
        const pos = editor.commands.exec("cursor.getPosition");
        if (pos) editor.commands.exec("buffer.insert", { line: pos.line, col: pos.col, text: text.text.toUpperCase() });
        editor.commands.exec("mode.set", { mode: "normal" });
    });

    editor.commands.register("vim.toLowerCase", () => {
        const text = editor.commands.exec("selection.getText");
        if (!text || !text.text) return;
        editor.commands.exec("edit.cut");
        const pos = editor.commands.exec("cursor.getPosition");
        if (pos) editor.commands.exec("buffer.insert", { line: pos.line, col: pos.col, text: text.text.toLowerCase() });
        editor.commands.exec("mode.set", { mode: "normal" });
    });

    // vim.reselect — reselect last visual selection (gv)
    // Son visual secimi tekrar sec
    editor.commands.register("vim.reselect", () => {
        editor.events.emit("vim.reselect");
    });

    // ══════════════════════════════════════════════════════════════
    //  Mark commands
    //  Isaret komutlari
    // ══════════════════════════════════════════════════════════════

    // vim.setMark — set mark at cursor, await register char (m)
    // Imlecte isaret koy, register karakteri bekle
    editor.commands.register("vim.setMark", () => {
        editor.events.emit("vim.awaitChar", {
            callback: (ch) => {
                editor.commands.exec("mark.set", { name: ch });
            }
        });
    });

    // vim.jumpToMark — jump to mark line start (')
    // Isaret satirinin basina git
    editor.commands.register("vim.jumpToMark", () => {
        editor.events.emit("vim.awaitChar", {
            callback: (ch) => {
                editor.commands.exec("mark.jump", { name: ch });
            }
        });
    });

    // vim.jumpToMarkExact — jump to exact mark position (`)
    // Tam isaret konumuna git
    editor.commands.register("vim.jumpToMarkExact", () => {
        editor.events.emit("vim.awaitChar", {
            callback: (ch) => {
                editor.commands.exec("mark.jump", { name: ch, exact: true });
            }
        });
    });

    // ══════════════════════════════════════════════════════════════
    //  Misc commands
    //  Diger komutlar
    // ══════════════════════════════════════════════════════════════

    // vim.commandMode — open command line (:)
    // Komut satirini ac
    editor.commands.register("vim.commandMode", () => {
        editor.events.emit("ui.commandLine", { prefix: ":" });
    });

    // vim.repeatLast — repeat last edit command (.)
    // Son duzenleme komutunu tekrarla
    editor.commands.register("vim.repeatLast", () => {
        editor.commands.exec("macro.play", { register: "." });
    });

    // Completion navigation for insert mode
    // Insert modu icin tamamlama gezinmesi
    editor.commands.register("vim.completionNext", () => {
        editor.events.emit("completion.next");
    });

    editor.commands.register("vim.completionPrev", () => {
        editor.events.emit("completion.prev");
    });

    console.log("[vim-mode] Motion and helper commands registered");
}
