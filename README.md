# BerkIDE Plugins

No impositions.

**Official plugin collection** for [berkide-core](https://github.com/berkide/berkide-core).

BerkIDE plugins are written in JavaScript (ES6) and run inside the core's V8 engine. They extend the editor with commands, keybindings, language support, themes, and more.

## Included Plugins

| Plugin | Description |
|--------|-------------|
| `auto-pairs` | Auto-close brackets, quotes, parentheses |
| `berkide-default` | Standard keybindings (VS Code / Sublime style) |
| `claude-ai` | Claude AI assistant — completion, refactor, explain, chat |
| `comment-toggle` | Toggle line/block comments (50+ languages) |
| `emacs-mode` | Emacs keybinding emulation (C-x prefix, kill ring, regions) |
| `file-explorer` | File system explorer with gitignore filtering |
| `git` | Git integration — status, diff, blame, commit, push |
| `lsp` | Language Server Protocol client (completion, hover, go-to-definition) |
| `snippet-engine` | Code snippet expansion with tab stops and transforms |
| `theme-default` | Default themes (dark + light) with tree-sitter scope mapping |
| `vim-mode` | Vim modal editing (normal, insert, visual) |

## Installation

Plugins are loaded automatically by berkide-core from `~/.berkide/plugins/`.

```bash
git clone https://github.com/berkide/berkide-plugins.git

# Copy a plugin to your berkide runtime
cp -r berkide-plugins/vim-mode ~/.berkide/plugins/vim-mode
```

Plugins are hot-reloaded — edit a plugin file and berkide-core picks up the changes automatically.

## Writing a Plugin

A minimal plugin (`~/.berkide/plugins/my-plugin/index.js`):

```javascript
// Simple plugin — IIFE pattern
(function() {
    editor.commands.register('myPlugin.hello', () => {
        return { message: 'Hello from my plugin!' };
    });

    console.log('[my-plugin] Loaded');
})();
```

Mode plugins (keybinding layers) use the `activate()/deactivate()` pattern:

```javascript
// Mode plugin — activate/deactivate pattern
export function activate() {
    editor.keymaps.set("normal", "j", "cursor.down");
    editor.keymaps.set("normal", "k", "cursor.up");
    console.log('[my-mode] Activated');
}

export function deactivate() {
    editor.keymaps.clear("normal");
    console.log('[my-mode] Deactivated');
}
```

### Plugin API

```javascript
editor.commands.register(name, handler)  // Register a command
editor.commands.exec(name, args)         // Execute a command
editor.events.on(event, callback)        // Listen for events
editor.events.emit(event, data)          // Emit an event
editor.keymaps.set(mode, key, command)   // Bind a key
editor.buffer.*                          // Buffer operations
editor.cursor.*                          // Cursor operations
editor.process.spawn(cmd, args, opts)    // Spawn external process
```

## Directory Structure

```
berkide-plugins/
├── auto-pairs/         # Bracket auto-close
├── berkide-default/    # Default keybindings
├── claude-ai/          # AI assistant
├── comment-toggle/     # Comment toggling
├── emacs-mode/         # Emacs keybindings
├── file-explorer/      # File browser
├── git/                # Git integration
├── lsp/                # Language Server Protocol
├── snippet-engine/     # Snippets
├── theme-default/      # Themes
└── vim-mode/           # Vim keybindings
```

## Related Projects

| Project | Description |
|---------|-------------|
| [berkide-core](https://github.com/berkide/berkide-core) | C++ headless editor engine |
| [berkide-tui](https://github.com/berkide/berkide-tui) | Terminal UI client |
| [berkidectl](https://github.com/berkide/berkidectl) | CLI management tool |

## License

MIT
