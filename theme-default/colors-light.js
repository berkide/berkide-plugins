// BerkIDE Light Theme — inspired by One Light / VS Code Light+
// BerkIDE Acik Tema — One Light / VS Code Light+ esinlenilmistir

export const lightTheme = {
    name: "berkide-light",
    type: "light",

    // Editor colors
    // Editor renkleri
    editor: {
        background:         "#eff1f5",
        foreground:         "#4c4f69",
        lineNumber:         "#9ca0b0",
        lineNumberActive:   "#4c4f69",
        cursor:             "#dc8a78",
        selection:          "#ccd0da",
        selectionHighlight: "#bcc0cc",
        findMatch:          "#df8e1d40",
        findMatchHighlight: "#df8e1d20",
        wordHighlight:      "#ccd0da40",
        lineHighlight:      "#e6e9ef",
        indentGuide:        "#ccd0da",
        whitespace:         "#ccd0da",
    },

    // UI element colors
    // UI eleman renkleri
    ui: {
        statusBar:          "#dce0e8",
        statusBarForeground:"#5c5f77",
        tabActive:          "#eff1f5",
        tabInactive:        "#e6e9ef",
        tabBorder:          "#ccd0da",
        sideBar:            "#e6e9ef",
        sideBarForeground:  "#4c4f69",
        panel:              "#e6e9ef",
        border:             "#ccd0da",
        scrollbar:          "#9ca0b050",
        badge:              "#d20f39",
        badgeForeground:    "#eff1f5",
    },

    // Syntax token colors (scope -> color mapping)
    // Soz dizimi token renkleri (kapsam -> renk eslesmesi)
    tokens: {
        "comment":              "#9ca0b0",
        "comment.doc":          "#8c8fa1",
        "string":               "#40a02b",
        "string.escape":        "#dd7878",
        "string.regex":         "#fe640b",
        "number":               "#fe640b",
        "boolean":              "#fe640b",
        "null":                 "#fe640b",
        "keyword":              "#8839ef",
        "keyword.control":      "#8839ef",
        "keyword.operator":     "#04a5e5",
        "keyword.import":       "#8839ef",
        "storage":              "#8839ef",
        "storage.type":         "#df8e1d",
        "storage.modifier":     "#8839ef",
        "operator":             "#04a5e5",
        "punctuation":          "#6c6f85",
        "punctuation.bracket":  "#6c6f85",
        "punctuation.delimiter":"#6c6f85",
        "variable":             "#4c4f69",
        "variable.builtin":     "#d20f39",
        "variable.parameter":   "#e64553",
        "variable.property":    "#1e66f5",
        "function":             "#1e66f5",
        "function.method":      "#1e66f5",
        "function.builtin":     "#df8e1d",
        "function.macro":       "#179299",
        "type":                 "#df8e1d",
        "type.builtin":         "#df8e1d",
        "class":                "#df8e1d",
        "interface":            "#179299",
        "enum":                 "#df8e1d",
        "constant":             "#fe640b",
        "constant.builtin":     "#fe640b",
        "tag":                  "#d20f39",
        "tag.attribute":        "#df8e1d",
        "attribute":            "#df8e1d",
        "namespace":            "#df8e1d",
        "label":                "#209fb5",
        "markup.heading":       "#1e66f5",
        "markup.bold":          "#4c4f69",
        "markup.italic":        "#ea76cb",
        "markup.link":          "#1e66f5",
        "markup.code":          "#40a02b",
        "diff.added":           "#40a02b",
        "diff.removed":         "#d20f39",
        "diff.changed":         "#df8e1d",
    },

    // ANSI terminal color palette (for TUI clients)
    // ANSI terminal renk paleti (TUI istemcileri icin)
    ansi: {
        black:          "#5c5f77",
        red:            "#d20f39",
        green:          "#40a02b",
        yellow:         "#df8e1d",
        blue:           "#1e66f5",
        magenta:        "#ea76cb",
        cyan:           "#179299",
        white:          "#acb0be",
        brightBlack:    "#6c6f85",
        brightRed:      "#d20f39",
        brightGreen:    "#40a02b",
        brightYellow:   "#df8e1d",
        brightBlue:     "#1e66f5",
        brightMagenta:  "#ea76cb",
        brightCyan:     "#179299",
        brightWhite:    "#bcc0cc",
    },

    // Git gutter colors
    // Git sutun renkleri
    git: {
        added:      "#40a02b",
        modified:   "#df8e1d",
        deleted:    "#d20f39",
        untracked:  "#9ca0b0",
        conflict:   "#fe640b",
    },

    // Diagnostic colors
    // Tani renkleri
    diagnostics: {
        error:      "#d20f39",
        warning:    "#df8e1d",
        info:       "#1e66f5",
        hint:       "#179299",
    },
};
