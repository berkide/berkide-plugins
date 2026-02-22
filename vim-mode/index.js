// Vim mode plugin — modal editing with normal, insert, visual modes
// Vim modu eklentisi — normal, insert, visual modlar ile modal duzenleme

import { registerNormalMode } from "./normal.js";
import { registerInsertMode } from "./insert.js";
import { registerVisualMode } from "./visual.js";
import { registerMotions } from "./motions.js";

// Register all vim sub-modules
// Tum vim alt modullerini kaydet
export function activate() {
    // Register motion commands first (used by all modes)
    // Once hareket komutlarini kaydet (tum modlar kullanir)
    registerMotions();

    // Register mode-specific keybindings
    // Moda ozel tus atamalari kaydet
    registerNormalMode();
    registerInsertMode();
    registerVisualMode();

    // Set initial mode to normal
    // Baslangic modunu normal olarak ayarla
    editor.commands.exec("mode.set", { mode: "normal" });

    console.log("[vim-mode] Vim modal editing activated — normal/insert/visual modes ready");
}

export function deactivate() {
    // Cleanup keymaps on deactivation
    // Deaktivasyon sirasinda tus haritalarini temizle
    console.log("[vim-mode] Vim mode deactivated");
}
