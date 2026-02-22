// Git commands — add, commit, push, pull, branch operations via process.spawn
// Git komutlari — process.spawn uzerinden add, commit, push, pull, dal islemleri

// Run a git command and return stdout
// Bir git komutu calistir ve stdout dondur
export function runGit(args) {
    const result = editor.process.spawn("git", args);
    return result;
}

// Register all git commands
// Tum git komutlarini kaydet
export function registerCommands() {

    // git.add — Stage files
    // git.add — Dosyalari sahneye al
    editor.commands.register("git.add", (args) => {
        const files = args?.files || ["."];
        return runGit(["add", ...files]);
    });

    // git.commit — Create a commit
    // git.commit — Bir commit olustur
    editor.commands.register("git.commit", (args) => {
        const message = args?.message;
        if (!message) return { error: "Commit message required" };
        return runGit(["commit", "-m", message]);
    });

    // git.push — Push to remote
    // git.push — Uzak sunucuya gonder
    editor.commands.register("git.push", (args) => {
        const remote = args?.remote || "origin";
        const branch = args?.branch || "";
        const gitArgs = ["push", remote];
        if (branch) gitArgs.push(branch);
        return runGit(gitArgs);
    });

    // git.pull — Pull from remote
    // git.pull — Uzak sunucudan cek
    editor.commands.register("git.pull", (args) => {
        const remote = args?.remote || "origin";
        const branch = args?.branch || "";
        const gitArgs = ["pull", remote];
        if (branch) gitArgs.push(branch);
        return runGit(gitArgs);
    });

    // git.fetch — Fetch from remote
    // git.fetch — Uzak sunucudan getir
    editor.commands.register("git.fetch", (args) => {
        const remote = args?.remote || "origin";
        return runGit(["fetch", remote]);
    });

    // git.checkout — Switch branch or restore files
    // git.checkout — Dal degistir veya dosyalari geri yukle
    editor.commands.register("git.checkout", (args) => {
        const target = args?.branch || args?.file;
        if (!target) return { error: "Provide branch or file" };
        return runGit(["checkout", target]);
    });

    // git.branchCreate — Create a new branch
    // git.branchCreate — Yeni bir dal olustur
    editor.commands.register("git.branchCreate", (args) => {
        const name = args?.name;
        if (!name) return { error: "Branch name required" };
        return runGit(["checkout", "-b", name]);
    });

    // git.branchList — List branches
    // git.branchList — Dallari listele
    editor.commands.register("git.branchList", () => {
        return runGit(["branch", "--list"]);
    });

    // git.branchDelete — Delete a branch
    // git.branchDelete — Bir dali sil
    editor.commands.register("git.branchDelete", (args) => {
        const name = args?.name;
        if (!name) return { error: "Branch name required" };
        return runGit(["branch", "-d", name]);
    });

    // git.log — Show commit log
    // git.log — Commit gunlugunu goster
    editor.commands.register("git.log", (args) => {
        const count = args?.count || 20;
        const format = args?.format || "%h %s (%an, %ar)";
        return runGit(["log", `--pretty=format:${format}`, `-n${count}`]);
    });

    // git.stash — Stash current changes
    // git.stash — Mevcut degisiklikleri sakla
    editor.commands.register("git.stash", (args) => {
        const action = args?.action || "push";
        if (action === "push") return runGit(["stash", "push"]);
        if (action === "pop") return runGit(["stash", "pop"]);
        if (action === "list") return runGit(["stash", "list"]);
        if (action === "drop") return runGit(["stash", "drop"]);
        return { error: "Unknown stash action: " + action };
    });

    // git.reset — Reset staged changes
    // git.reset — Sahnelenmis degisiklikleri sifirla
    editor.commands.register("git.reset", (args) => {
        const files = args?.files;
        if (files) return runGit(["reset", "HEAD", ...files]);
        return runGit(["reset", "HEAD"]);
    });

    // git.init — Initialize a new repo
    // git.init — Yeni bir depo baslar
    editor.commands.register("git.init", () => {
        return runGit(["init"]);
    });
}
