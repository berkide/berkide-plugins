// LSP definition/references handler — goto definition, find references
// LSP tanim/referans isleyicisi — tanima git, referanslari bul

// Transform LSP Location or LocationLink into a BerkIDE-friendly format
// LSP Location veya LocationLink'i BerkIDE uyumlu formata donustur
export function transformLocation(result) {
    if (!result) return [];

    const locations = Array.isArray(result) ? result : [result];

    return locations.map(loc => {
        // Handle LocationLink (targetUri, targetRange)
        // LocationLink'i isle (targetUri, targetRange)
        if (loc.targetUri) {
            return {
                uri: loc.targetUri,
                line: loc.targetRange.start.line,
                col: loc.targetRange.start.character,
            };
        }

        // Handle Location (uri, range)
        // Location'i isle (uri, range)
        if (loc.uri && loc.range) {
            return {
                uri: loc.uri,
                line: loc.range.start.line,
                col: loc.range.start.character,
            };
        }

        return null;
    }).filter(Boolean);
}

// Convert file:// URI to local path
// file:// URI'sini yerel yola donustur
export function uriToPath(uri) {
    if (uri.startsWith("file://")) {
        return decodeURIComponent(uri.substring(7));
    }
    return uri;
}

// Navigate to a location (open file and set cursor)
// Bir konuma git (dosyayi ac ve imleci ayarla)
export function gotoLocation(location) {
    const path = uriToPath(location.uri);
    editor.buffers.openFile(path);
    editor.cursor.setPosition(location.line, location.col);
}
