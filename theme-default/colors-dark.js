// BerkIDE Dark Theme — inspired by One Dark / VS Code Dark+
// BerkIDE Koyu Tema — One Dark / VS Code Dark+ esinlenilmistir

export const darkTheme = {
    name: "berkide-dark",
    type: "dark",

    // Editor colors
    // Editor renkleri
    editor: {
        background:         "#1e1e2e",
        foreground:         "#cdd6f4",
        lineNumber:         "#6c7086",
        lineNumberActive:   "#cdd6f4",
        cursor:             "#f5e0dc",
        selection:          "#45475a",
        selectionHighlight: "#585b70",
        findMatch:          "#f9e2af40",
        findMatchHighlight: "#f9e2af20",
        wordHighlight:      "#58587040",
        lineHighlight:      "#313244",
        indentGuide:        "#45475a",
        whitespace:         "#45475a",
    },

    // UI element colors
    // UI eleman renkleri
    ui: {
        statusBar:          "#181825",
        statusBarForeground:"#bac2de",
        tabActive:          "#1e1e2e",
        tabInactive:        "#181825",
        tabBorder:          "#313244",
        sideBar:            "#181825",
        sideBarForeground:  "#cdd6f4",
        panel:              "#181825",
        border:             "#313244",
        scrollbar:          "#585b7050",
        badge:              "#f38ba8",
        badgeForeground:    "#1e1e2e",
    },

    // Syntax token colors (scope -> color mapping)
    // Soz dizimi token renkleri (kapsam -> renk eslesmesi)
    tokens: {
        "comment":              "#6c7086",
        "comment.doc":          "#7f849c",
        "string":               "#a6e3a1",
        "string.escape":        "#f2cdcd",
        "string.regex":         "#fab387",
        "number":               "#fab387",
        "boolean":              "#fab387",
        "null":                 "#fab387",
        "keyword":              "#cba6f7",
        "keyword.control":      "#cba6f7",
        "keyword.operator":     "#89dceb",
        "keyword.import":       "#cba6f7",
        "storage":              "#cba6f7",
        "storage.type":         "#f9e2af",
        "storage.modifier":     "#cba6f7",
        "operator":             "#89dceb",
        "punctuation":          "#9399b2",
        "punctuation.bracket":  "#9399b2",
        "punctuation.delimiter":"#9399b2",
        "variable":             "#cdd6f4",
        "variable.builtin":     "#f38ba8",
        "variable.parameter":   "#eba0ac",
        "variable.property":    "#89b4fa",
        "function":             "#89b4fa",
        "function.method":      "#89b4fa",
        "function.builtin":     "#f9e2af",
        "function.macro":       "#94e2d5",
        "type":                 "#f9e2af",
        "type.builtin":         "#f9e2af",
        "class":                "#f9e2af",
        "interface":            "#94e2d5",
        "enum":                 "#f9e2af",
        "constant":             "#fab387",
        "constant.builtin":     "#fab387",
        "tag":                  "#f38ba8",
        "tag.attribute":        "#f9e2af",
        "attribute":            "#f9e2af",
        "namespace":            "#f9e2af",
        "label":                "#74c7ec",
        "markup.heading":       "#89b4fa",
        "markup.bold":          "#cdd6f4",
        "markup.italic":        "#f5c2e7",
        "markup.link":          "#89b4fa",
        "markup.code":          "#a6e3a1",
        "diff.added":           "#a6e3a1",
        "diff.removed":         "#f38ba8",
        "diff.changed":         "#f9e2af",
    },

    // ANSI terminal color palette (for TUI clients)
    // ANSI terminal renk paleti (TUI istemcileri icin)
    ansi: {
        black:          "#45475a",
        red:            "#f38ba8",
        green:          "#a6e3a1",
        yellow:         "#f9e2af",
        blue:           "#89b4fa",
        magenta:        "#f5c2e7",
        cyan:           "#94e2d5",
        white:          "#bac2de",
        brightBlack:    "#585b70",
        brightRed:      "#f38ba8",
        brightGreen:    "#a6e3a1",
        brightYellow:   "#f9e2af",
        brightBlue:     "#89b4fa",
        brightMagenta:  "#f5c2e7",
        brightCyan:     "#94e2d5",
        brightWhite:    "#a6adc8",
    },

    // Git gutter colors
    // Git sutun renkleri
    git: {
        added:      "#a6e3a1",
        modified:   "#f9e2af",
        deleted:    "#f38ba8",
        untracked:  "#6c7086",
        conflict:   "#fab387",
    },

    // Diagnostic colors
    // Tani renkleri
    diagnostics: {
        error:      "#f38ba8",
        warning:    "#f9e2af",
        info:       "#89b4fa",
        hint:       "#94e2d5",
    },
};
