// Auto-pairs plugin — automatically close brackets, quotes, and tags
// Otomatik cift eklentisi — parantezleri, tirnaklari ve etiketleri otomatik kapat
//
// Features:
// - Auto-close: type ( → get ()
// - Smart skip: type ) when cursor is before ) → move right, don't insert
// - Auto-delete: backspace on empty pair () → delete both
// - Wrap selection: select text + type ( → wrap with (selected)
// Ozellikler:
// - Otomatik kapatma: ( yaz → () al
// - Akilli atlama: imleç ) oncesindeyken ) yaz → saga git, ekleme
// - Otomatik silme: bos ciftte () backspace → ikisini de sil
// - Secimi sarmalama: metin sec + ( yaz → (secili) ile sarmala

// Pair definitions (open -> close)
// Cift tanimlari (acilis -> kapanis)
const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '`': '`',
};

const openChars = new Set(Object.keys(pairs));
const closeChars = new Set(Object.values(pairs));
const quoteChars = new Set(['"', "'", '`']);

// Handle character input for auto-pairing
// Otomatik esleme icin karakter girdisini isle
editor.commands.register("autopairs.onChar", (args) => {
    const ch = args?.char;
    if (!ch) return;

    const line = editor.cursor.getLine();
    const col = editor.cursor.getCol();
    const lineText = editor.buffer.getLine(line);
    const charAfter = lineText[col] || '';
    const charBefore = col > 0 ? lineText[col - 1] : '';

    // Check if selection is active — wrap selection with pair
    // Secim aktif mi kontrol et — secimi ciftle sarmala
    if (editor.selection.isActive() && openChars.has(ch)) {
        const range = editor.selection.getRange();
        const text = editor.selection.getText();
        const close = pairs[ch];

        editor.buffer.deleteRange(range.startLine, range.startCol, range.endLine, range.endCol);
        editor.buffer.insertText(range.startLine, range.startCol, ch + text + close);
        editor.cursor.setPosition(range.startLine, range.startCol + 1 + text.length);
        editor.selection.clear();
        return { handled: true };
    }

    // Smart skip: if typing a close char and it's already the next char, just move right
    // Akilli atlama: kapanis karakteri yaziliyorsa ve zaten sonraki karakterse, sadece saga git
    if (closeChars.has(ch) && charAfter === ch) {
        editor.cursor.moveRight();
        return { handled: true };
    }

    // Auto-close: insert the pair
    // Otomatik kapatma: cifti ekle
    if (openChars.has(ch)) {
        const close = pairs[ch];

        // For quotes, don't auto-close if previous char is alphanumeric (likely part of a word)
        // Tirnaklar icin, onceki karakter alfasayisalsa otomatik kapatma (buyuk ihtimalle kelimenin parcasi)
        if (quoteChars.has(ch) && charBefore && /\w/.test(charBefore)) {
            return { handled: false };
        }

        editor.buffer.insertText(line, col, ch + close);
        editor.cursor.setPosition(line, col + 1);
        return { handled: true };
    }

    return { handled: false };
});

// Handle backspace for auto-delete of empty pairs
// Bos ciftlerin otomatik silinmesi icin backspace'i isle
editor.commands.register("autopairs.onBackspace", (args) => {
    const line = editor.cursor.getLine();
    const col = editor.cursor.getCol();
    if (col === 0) return { handled: false };

    const lineText = editor.buffer.getLine(line);
    const charBefore = lineText[col - 1];
    const charAfter = lineText[col] || '';

    // If cursor is between an empty pair like (), delete both
    // Imleç () gibi bos bir ciftin arasindaysa, ikisini de sil
    if (openChars.has(charBefore) && pairs[charBefore] === charAfter) {
        editor.buffer.deleteRange(line, col - 1, line, col + 1);
        editor.cursor.setPosition(line, col - 1);
        return { handled: true };
    }

    return { handled: false };
});

// Register commands for adding/removing custom pairs
// Ozel cift ekleme/kaldirma komutlarini kaydet
editor.commands.register("autopairs.addPair", (args) => {
    if (args?.open && args?.close) {
        pairs[args.open] = args.close;
        openChars.add(args.open);
        closeChars.add(args.close);
        return { added: args.open + args.close };
    }
    return { error: "Provide 'open' and 'close' characters" };
});

editor.commands.register("autopairs.listPairs", () => {
    return { ...pairs };
});

console.log("[auto-pairs] Loaded: " + Object.keys(pairs).map(k => k + pairs[k]).join(" "));
