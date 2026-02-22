// BerkIDE Default Keybindings — universal shortcuts every developer expects
// BerkIDE Varsayilan Tus Baglantilari — her gelistiricinin bekledigi evrensel kisayollar
//
// This plugin provides a standard keybinding set similar to VS Code / Sublime / modern editors.
// Bu eklenti VS Code / Sublime / modern editorlere benzer standart tus baglantilari saglar.
// It does NOT provide vim or emacs modes — those are separate plugins.
// Vim veya emacs modlari SAGLAMAZ — onlar ayri eklentilerdir.

import { registerNavCommands } from "./keys-nav.js";
import { registerEditingCommands } from "./keys-editing.js";
import { registerFileCommands } from "./keys-file.js";
import { registerSearchCommands } from "./keys-search.js";

export function activate() {
    registerNavCommands();
    registerEditingCommands();
    registerFileCommands();
    registerSearchCommands();

    console.log("[berkide-default] Default keybindings activated");
}

export function deactivate() {
    console.log("[berkide-default] Default keybindings deactivated");
}
