// Git integration plugin — status, diff, blame, and git operations
// Git entegrasyon eklentisi — durum, fark, blame ve git islemleri
//
// Uses editor.process.spawn() to run git commands.
// Git komutlarini calistirmak icin editor.process.spawn() kullanir.
// Emits events for UI clients to show git state (gutter marks, status bar, etc).
// UI istemcilerin git durumunu gostermesi icin olaylar yayar (sutun isaretleri, durum cubugu, vb).

import { parseStatus, parseBranch, statusSummary } from './status.js';
import { parseDiff, gutterMarks, applyGutterExtmarks } from './diff.js';
import { parseBlame, applyBlameExtmarks } from './blame.js';
import { registerCommands, runGit } from './commands.js';

// Register all git operation commands (add, commit, push, pull, etc.)
// Tum git islem komutlarini kaydet (add, commit, push, pull, vb.)
registerCommands();

// git.status — Get parsed status of current repo
// git.status — Mevcut deponun ayristirilmis durumunu al
editor.commands.register("git.status", () => {
    const output = runGit(["status", "--porcelain"]);
    if (typeof output !== 'string') return { error: "git status failed", raw: output };
    const files = parseStatus(output);
    const summary = statusSummary(files);
    editor.events.emit("git.statusChanged", JSON.stringify({ files, summary }));
    return { files, summary };
});

// git.branch — Get current branch name
// git.branch — Mevcut dal adini al
editor.commands.register("git.branch", () => {
    const output = runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
    if (typeof output !== 'string') return { error: "git branch failed" };
    const branch = parseBranch(output);
    editor.events.emit("git.branchChanged", JSON.stringify({ branch }));
    return { branch };
});

// git.diff — Get diff for current file and apply gutter marks
// git.diff — Mevcut dosya icin farki al ve sutun isaretlerini uygula
editor.commands.register("git.diff", (args) => {
    const file = args?.file || "";
    const gitArgs = ["diff"];
    if (file) gitArgs.push(file);
    const output = runGit(gitArgs);
    if (typeof output !== 'string') return { error: "git diff failed" };
    const hunks = parseDiff(output);
    const marks = gutterMarks(hunks);
    if (file) applyGutterExtmarks(marks, file);
    return { hunks, marks };
});

// git.diffStaged — Get staged diff
// git.diffStaged — Sahnelenmis farki al
editor.commands.register("git.diffStaged", (args) => {
    const file = args?.file || "";
    const gitArgs = ["diff", "--staged"];
    if (file) gitArgs.push(file);
    const output = runGit(gitArgs);
    if (typeof output !== 'string') return { error: "git diff --staged failed" };
    return { hunks: parseDiff(output) };
});

// git.blame — Get blame for current file and show as virtual text
// git.blame — Mevcut dosya icin blame al ve sanal metin olarak goster
editor.commands.register("git.blame", (args) => {
    const file = args?.file;
    if (!file) return { error: "File path required" };
    const output = runGit(["blame", "--porcelain", file]);
    if (typeof output !== 'string') return { error: "git blame failed" };
    const blameData = parseBlame(output);
    applyBlameExtmarks(blameData);
    return { entries: blameData.length };
});

// git.blameHide — Remove blame virtual text
// git.blameHide — Blame sanal metnini kaldir
editor.commands.register("git.blameHide", () => {
    editor.extmarks.clearNamespace("git-blame");
    return { cleared: true };
});

// Auto-refresh git status when buffer is saved
// Buffer kaydedildiginde git durumunu otomatik yenile
editor.events.on("fileSaved", () => {
    try {
        const output = runGit(["status", "--porcelain"]);
        if (typeof output === 'string') {
            const files = parseStatus(output);
            const summary = statusSummary(files);
            editor.events.emit("git.statusChanged", JSON.stringify({ files, summary }));
        }
    } catch (e) {
        // Not a git repo or git not installed — silent fail
        // Git deposu degil veya git kurulu degil — sessiz hata
    }
});

console.log("[git] Git integration loaded");
