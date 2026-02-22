// Git status parsing — run git status and parse porcelain output
// Git durum ayristirma — git status calistir ve porcelain ciktisini ayristir

// File status codes from git status --porcelain=v1
// git status --porcelain=v1 dosya durum kodlari
const STATUS_MAP = {
    'M': 'modified',
    'A': 'added',
    'D': 'deleted',
    'R': 'renamed',
    'C': 'copied',
    'U': 'unmerged',
    '?': 'untracked',
    '!': 'ignored',
};

// Parse git status --porcelain output into structured data
// git status --porcelain ciktisini yapisal veriye ayristir
export function parseStatus(output) {
    const files = [];
    const lines = output.split('\n');

    for (const line of lines) {
        if (line.length < 4) continue;

        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const filePath = line.substring(3);

        // Handle renames: "R  old -> new"
        // Yeniden adlandirmalari isle: "R  eski -> yeni"
        let oldPath = null;
        let actualPath = filePath;
        if (filePath.includes(' -> ')) {
            const parts = filePath.split(' -> ');
            oldPath = parts[0];
            actualPath = parts[1];
        }

        files.push({
            path: actualPath,
            oldPath,
            indexStatus: STATUS_MAP[indexStatus] || indexStatus.trim() || null,
            workTreeStatus: STATUS_MAP[workTreeStatus] || workTreeStatus.trim() || null,
            staged: indexStatus !== ' ' && indexStatus !== '?',
        });
    }

    return files;
}

// Get current branch name
// Mevcut dal adini al
export function parseBranch(output) {
    return output.trim();
}

// Summary statistics from status
// Durumdan ozet istatistikler
export function statusSummary(files) {
    const summary = { modified: 0, added: 0, deleted: 0, untracked: 0, staged: 0, conflicts: 0 };
    for (const f of files) {
        if (f.workTreeStatus === 'modified') summary.modified++;
        if (f.indexStatus === 'added' || f.workTreeStatus === 'untracked') summary.added++;
        if (f.workTreeStatus === 'deleted' || f.indexStatus === 'deleted') summary.deleted++;
        if (f.workTreeStatus === 'untracked') summary.untracked++;
        if (f.staged) summary.staged++;
        if (f.workTreeStatus === 'unmerged' || f.indexStatus === 'unmerged') summary.conflicts++;
    }
    return summary;
}
