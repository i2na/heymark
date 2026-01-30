import inquirer from "inquirer";
import { saveConfig, getProfileNames, getBinDir } from "./util/config.js";
import chalk from "chalk";
import path from "path";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import { execSync } from "child_process";

function getDefaultPostsUrl() {
    let owner = process.env.POSTS_REPO_OWNER || "OWNER";
    let repo = process.env.POSTS_REPO_NAME || "REPO_NAME";
    for (const name of [".env.local", ".env"]) {
        try {
            const content = fsSync.readFileSync(path.resolve(process.cwd(), name), "utf-8");
            const strip = (s) => (s || "").trim().replace(/^["']|["']$/g, "");
            content.split("\n").forEach((line) => {
                const trimmed = line.trim();
                if (trimmed.startsWith("POSTS_REPO_OWNER="))
                    owner = strip(trimmed.slice(17)) || owner;
                if (trimmed.startsWith("POSTS_REPO_NAME=")) repo = strip(trimmed.slice(16)) || repo;
            });
            break;
        } catch {
            // no file
        }
    }
    return `https://github.com/${owner}/${repo}.git`;
}

function getWrapperContent(profileName) {
    const envLine =
        process.platform === "win32"
            ? `set HEYMARK_PROFILE=${profileName} & call heymark %*`
            : `HEYMARK_PROFILE=${profileName} exec heymark "$@"`;
    if (process.platform === "win32") {
        return `@echo off\n${envLine}\n`;
    }
    return `#!/bin/sh\n${envLine}\n`;
}

async function syncBinWrappers(profileNames) {
    const binDir = getBinDir();
    await fs.mkdir(binDir, { recursive: true });
    const ext = process.platform === "win32" ? ".cmd" : "";
    for (const name of profileNames) {
        const filePath = path.join(binDir, name + ext);
        await fs.writeFile(filePath, getWrapperContent(name), "utf-8");
        if (process.platform !== "win32") {
            fsSync.chmodSync(filePath, 0o755);
        }
    }
}

async function addToPath() {
    const binDir = getBinDir();
    const line = 'export PATH="$HOME/.heymark-cli/bin:$PATH"';
    if (process.platform === "win32") {
        try {
            const ps = `$p=[Environment]::GetEnvironmentVariable('Path','User');if($p -notlike '*\\.heymark-cli\\bin*'){[Environment]::SetEnvironmentVariable('Path',$p+';${binDir}','User')}`;
            execSync("powershell -NoProfile -Command " + JSON.stringify(ps), { stdio: "pipe" });
            console.log(chalk.green("✓ Added profile bin to PATH (User). Restart the terminal."));
        } catch {
            console.log(chalk.dim("Path: " + binDir));
        }
        return;
    }
    const zshrc = path.join(os.homedir(), ".zshrc");
    const bashrc = path.join(os.homedir(), ".bashrc");
    const rcFile =
        (await fs
            .access(zshrc)
            .then(() => zshrc)
            .catch(() => null)) ||
        (await fs
            .access(bashrc)
            .then(() => bashrc)
            .catch(() => null)) ||
        zshrc;
    let content = "";
    try {
        content = await fs.readFile(rcFile, "utf-8");
    } catch {
        // new file
    }
    if (content.includes(".heymark-cli/bin")) {
        console.log(chalk.dim("Profile bin already in PATH (" + path.basename(rcFile) + ")"));
        return;
    }
    const append = content.trimEnd() ? "\n\n" + line + "\n" : line + "\n";
    await fs.appendFile(rcFile, append);
    console.log(
        chalk.green(
            "✓ Added profile bin to " +
                path.basename(rcFile) +
                ". Restart the terminal or: source " +
                rcFile
        )
    );
}

async function setup() {
    console.log(chalk.bold("\n🗂️  Heymark CLI Setup\n"));
    console.log(chalk.dim("Please provide the following information:\n"));

    const defaultPostsUrl = getDefaultPostsUrl();

    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "cliName",
            message: "Profile name (e.g. post, blog):",
            default: "post",
            validate: (input) => {
                if (!input || input.trim() === "") {
                    return "Profile name is required";
                }
                if (!/^[a-z0-9-]+$/.test(input)) {
                    return "Profile name can only contain lowercase letters, numbers, and hyphens";
                }
                return true;
            },
        },
        {
            type: "input",
            name: "postsGitRemote",
            message: "Posts Git repository URL:",
            default: defaultPostsUrl,
        },
        {
            type: "input",
            name: "postsRepoPath",
            message: "Posts folder (local absolute path):",
            default: "C:\\Users\\USER\\posts-archive",
            validate: (input) => {
                if (!input || input.trim() === "") {
                    return "Posts folder path is required";
                }
                if (!path.isAbsolute(input)) {
                    return "Please provide an absolute path";
                }
                return true;
            },
        },
    ]);

    const configPath = await saveConfig(
        {
            cliName: answers.cliName,
            postsGitRemote: answers.postsGitRemote,
            postsRepoPath: answers.postsRepoPath,
        },
        answers.cliName
    );

    const profileNames = await getProfileNames();
    await syncBinWrappers(profileNames);

    console.log(chalk.green(`\n✓ Profile '${answers.cliName}' saved (${configPath})`));
    console.log(chalk.dim("\nProfile commands: " + profileNames.join(", ")));
    if (profileNames.length > 0) {
        await addToPath();
    }
    console.log(chalk.dim("\nNext: yarn link"));
}

setup().catch((error) => {
    console.error(chalk.red("\n✗ Setup failed"));
    console.error(chalk.dim(error.message));
    process.exit(1);
});
