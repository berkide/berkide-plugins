// Git diff parsing — parse unified diff output for gutter marks
// Git fark ayristirma — satir isareti icin birlesmis fark ciktisini ayristir

// Parse unified diff output into hunk data
// Birlesmis fark ciktisini hunk verisine ayristir
export function parseDiff(output) {
    const hunks = [];
    const lines = output.split('\n');
    let currentHunk = null;

    for (const line of lines) {
        // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
        // Hunk baslik: @@ -eskiBaslangic,eskiSayi +yeniBaslangic,yeniSayi @@
        if (line.startsWith('@@')) {
            const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
            if (match) {
                currentHunk = {
                    oldStart: parseInt(match[1]),
                    oldCount: parseInt(match[2] || '1'),
                    newStart: parseInt(match[3]),
                    newCount: parseInt(match[4] || '1'),
                    changes: [],
                };
                hunks.push(currentHunk);
            }
            continue;
        }

        if (!currentHunk) continue;

        if (line.startsWith('+') && !line.startsWith('+++')) {
            currentHunk.changes.push({ type: 'added', text: line.substring(1) });
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            currentHunk.changes.push({ type: 'removed', text: line.substring(1) });
        } else if (line.startsWith(' ')) {
            currentHunk.changes.push({ type: 'context', text: line.substring(1) });
        }
    }

    return hunks;
}

// Convert hunks to line-level gutter marks for the UI
// Hunk'lari UI icin satir seviyesinde sutun isaretlerine donustur
export function gutterMarks(hunks) {
    const marks = [];

    for (const hunk of hunks) {
        let newLine = hunk.newStart;

        for (const change of hunk.changes) {
            if (change.type === 'added') {
                marks.push({ line: newLine, type: 'added' });
                newLine++;
            } else if (change.type === 'removed') {
                // Removed lines show as a marker on the current line
                // Silinen satirlar mevcut satirda isaret olarak gosterilir
                marks.push({ line: newLine, type: 'removed' });
            } else {
                newLine++;
            }
        }
    }

    return marks;
}

// Apply gutter marks as extmarks on the buffer
// Sutun isaretlerini buffer uzerinde extmark olarak uygula
export function applyGutterExtmarks(marks, filePath) {
    // Clear previous git extmarks
    // Onceki git extmark'larini temizle
    editor.extmarks.clearNamespace("git-gutter");

    for (const mark of marks) {
        editor.extmarks.set("git-gutter", mark.line - 1, 0, mark.line - 1, 0, mark.type, "");
    }
}
