// BerkIDE Default Theme Plugin — dark and light themes with tree-sitter scope mapping
// BerkIDE Varsayilan Tema Eklentisi — tree-sitter kapsam eslesmeli koyu ve acik temalar
//
// Themes provide color definitions. UI clients consume these to render syntax colors.
// Temalar renk tanimlamalari saglar. UI istemcileri bunlari soz dizimi renklendirmesi icin kullanir.
// Core does NOT render — it only provides tree-sitter AST + scope mapping data.
// Core render YAPMAZ — sadece tree-sitter AST + kapsam esleme verisini saglar.

import { darkTheme } from './colors-dark.js';
import { lightTheme } from './colors-light.js';
import { scopeMap, languageOverrides } from './scopes.js';

// Theme registry — available themes
// Tema kaydi — mevcut temalar
const themes = {
    "berkide-dark": darkTheme,
    "berkide-light": lightTheme,
};

// Active theme (default: dark)
// Aktif tema (varsayilan: koyu)
let activeThemeName = "berkide-dark";

// Register theme commands
// Tema komutlarini kaydet
editor.commands.register("theme.list", () => {
    return Object.keys(themes);
});

editor.commands.register("theme.get", (args) => {
    const name = args?.name || activeThemeName;
    return themes[name] || null;
});

editor.commands.register("theme.set", (args) => {
    const name = args?.name;
    if (!name || !themes[name]) return { error: "Unknown theme: " + name };
    activeThemeName = name;
    editor.events.emit("themeChanged", JSON.stringify({ name }));
    return { name };
});

editor.commands.register("theme.active", () => {
    return { name: activeThemeName, theme: themes[activeThemeName] };
});

editor.commands.register("theme.scopes", () => {
    return scopeMap;
});

editor.commands.register("theme.scopesForLanguage", (args) => {
    const lang = args?.language;
    const merged = { ...scopeMap };
    if (lang && languageOverrides[lang]) {
        Object.assign(merged, languageOverrides[lang]);
    }
    return merged;
});

// Allow other plugins to register custom themes
// Diger eklentilerin ozel tema kaydetmesine izin ver
editor.commands.register("theme.register", (args) => {
    if (!args?.theme?.name) return { error: "Theme must have a name" };
    themes[args.theme.name] = args.theme;
    return { registered: args.theme.name };
});

console.log("[theme-default] Themes loaded: " + Object.keys(themes).join(", "));
console.log("[theme-default] Active: " + activeThemeName);
