// Git blame parsing — show commit info as virtual text on lines
// Git blame ayristirma — satirlarda sanal metin olarak commit bilgisi goster

// Parse git blame --porcelain output
// git blame --porcelain ciktisini ayristir
export function parseBlame(output) {
    const lines = output.split('\n');
    const blameData = [];
    let current = null;

    for (const line of lines) {
        // Commit hash line (40 hex chars + line numbers)
        // Commit hash satiri (40 hex karakter + satir numaralari)
        const commitMatch = line.match(/^([0-9a-f]{40}) (\d+) (\d+)/);
        if (commitMatch) {
            current = {
                hash: commitMatch[1],
                originalLine: parseInt(commitMatch[2]),
                finalLine: parseInt(commitMatch[3]),
                author: '',
                date: '',
                summary: '',
            };
            continue;
        }

        if (!current) continue;

        if (line.startsWith('author ')) {
            current.author = line.substring(7);
        } else if (line.startsWith('author-time ')) {
            const timestamp = parseInt(line.substring(12));
            current.date = formatRelativeDate(timestamp);
        } else if (line.startsWith('summary ')) {
            current.summary = line.substring(8);
        } else if (line.startsWith('\t')) {
            // Content line — this blame entry is complete
            // Icerik satiri — bu blame girdisi tamamlandi
            blameData.push({ ...current });
            current = null;
        }
    }

    return blameData;
}

// Format timestamp as relative date (e.g., "3 days ago", "2 months ago")
// Zaman damgasini goreceli tarih olarak formatla (orn. "3 gun once", "2 ay once")
function formatRelativeDate(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 2592000) return Math.floor(diff / 86400) + "d ago";
    if (diff < 31536000) return Math.floor(diff / 2592000) + "mo ago";
    return Math.floor(diff / 31536000) + "y ago";
}

// Format blame line for virtual text display
// Sanal metin gorunumu icin blame satirini formatla
export function formatBlameLine(entry) {
    if (entry.hash === '0000000000000000000000000000000000000000') {
        return "Not committed yet";
    }
    const shortHash = entry.hash.substring(0, 7);
    return `${entry.author}, ${entry.date} — ${entry.summary} (${shortHash})`;
}

// Apply blame data as virtual text extmarks
// Blame verisini sanal metin extmark'lari olarak uygula
export function applyBlameExtmarks(blameData) {
    editor.extmarks.clearNamespace("git-blame");

    for (const entry of blameData) {
        const text = formatBlameLine(entry);
        editor.extmarks.setWithVirtText(
            "git-blame",
            entry.finalLine - 1, 0,
            entry.finalLine - 1, 0,
            text,
            "eol",      // Show at end of line
            "comment",  // Style as comment (dimmed)
            "blame",
            JSON.stringify({ hash: entry.hash, author: entry.author })
        );
    }
}
