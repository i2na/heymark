import fs from "fs/promises";
import path from "path";
import os from "os";
import chalk from "chalk";

const CONFIG_DIR = path.join(os.homedir(), ".heymark-cli");
const CONFIG_PATH_NEW = path.join(CONFIG_DIR, "config.json");
const CONFIG_PATH_OLD = path.join(os.homedir(), ".heymark-cli.json");

export function getConfigPath() {
    return CONFIG_PATH_NEW;
}

export function getBinDir() {
    return path.join(CONFIG_DIR, "bin");
}

async function getConfigPathToRead() {
    try {
        await fs.access(CONFIG_PATH_NEW);
        return CONFIG_PATH_NEW;
    } catch {
        try {
            await fs.access(CONFIG_PATH_OLD);
            return CONFIG_PATH_OLD;
        } catch {
            return CONFIG_PATH_NEW;
        }
    }
}

function isMultiProfile(config) {
    return config && typeof config.profiles === "object" && !Array.isArray(config.profiles);
}

export async function getConfig() {
    const configPath = await getConfigPathToRead();
    try {
        const content = await fs.readFile(configPath, "utf-8");
        const data = JSON.parse(content);
        if (configPath === CONFIG_PATH_OLD) {
            await fs.mkdir(CONFIG_DIR, { recursive: true });
            await fs.writeFile(
                CONFIG_PATH_NEW,
                JSON.stringify(
                    isMultiProfile(data)
                        ? data
                        : {
                              profiles: {
                                  [data.cliName]: {
                                      postsGitRemote: data.postsGitRemote,
                                      postsRepoPath: data.postsRepoPath,
                                  },
                              },
                          },
                    null,
                    2
                ),
                "utf-8"
            );
        }
        if (isMultiProfile(data)) {
            const profileName = (process.env.HEYMARK_PROFILE || "").trim();
            if (!profileName) {
                console.error(chalk.red("✗ No profile selected"));
                console.error(chalk.dim("Run via a profile command: post add, blog add, etc."));
                process.exit(1);
            }
            const profile = data.profiles[profileName];
            if (!profile) {
                console.error(chalk.red(`✗ Profile "${profileName}" not found`));
                console.error(chalk.dim(`Available: ${Object.keys(data.profiles).join(", ")}`));
                process.exit(1);
            }
            return {
                postsGitRemote: profile.postsGitRemote,
                postsRepoPath: profile.postsRepoPath,
                cliName: profileName,
            };
        }

        return {
            postsGitRemote: data.postsGitRemote,
            postsRepoPath: data.postsRepoPath,
            cliName: data.cliName,
        };
    } catch (error) {
        console.error(chalk.red("✗ Config file not found"));
        console.error(chalk.dim('Run "node cli/setup.js" first'));
        process.exit(1);
    }
}

export async function getProfileNames() {
    try {
        const configPath = await getConfigPathToRead();
        const content = await fs.readFile(configPath, "utf-8");
        const data = JSON.parse(content);
        if (isMultiProfile(data)) return Object.keys(data.profiles);
        if (data.cliName) return [data.cliName];
        return [];
    } catch {
        return [];
    }
}

export async function saveConfig(config, cliName) {
    let existing = { profiles: {} };
    let configPath = CONFIG_PATH_NEW;
    try {
        const toRead = await getConfigPathToRead();
        const content = await fs.readFile(toRead, "utf-8");
        const data = JSON.parse(content);
        if (isMultiProfile(data)) {
            existing = data;
        } else if (data.cliName) {
            existing.profiles[data.cliName] = {
                postsGitRemote: data.postsGitRemote,
                postsRepoPath: data.postsRepoPath,
            };
        }
    } catch {
        // no file or invalid
    }

    existing.profiles[cliName] = {
        postsGitRemote: config.postsGitRemote,
        postsRepoPath: config.postsRepoPath,
    };

    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(
        CONFIG_PATH_NEW,
        JSON.stringify({ profiles: existing.profiles }, null, 2),
        "utf-8"
    );
    return CONFIG_PATH_NEW;
}
