# CLI Guide

## Tech Stack

Node.js, Commander, Gray Matter, Yarn

## Project Structure

```
heymark/
├── cli/
│   ├── index.js           # Entry; registers commands
│   ├── setup.js           # First-time config
│   ├── command/           # add, call, open
│   ├── util/              # config, git
│   └── prompt/            # copy.md (template for call)
```

## Prerequisite: Private repository

The CLI writes markdown posts to a Git-backed folder. Set this up first:

1. **Create a private repo on GitHub** (e.g. `posts-archive`).
2. **Create a Personal Access Token** — GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic). Use scope `repo`. Store the token safely.
3. **Clone the repo locally** and use its absolute path when running setup.

## CLI Setup

### 1. Run setup

```bash
yarn install
node cli/setup.js
```

- **Prompts** — Profile name (e.g. `post`, `blog`), posts repo URL, local folder path (absolute).
- **Creates/updates** — `~/.heymark-cli/config.json` (multi-profile):

    ```json
    {
        "profiles": {
            "post": {
                "postsGitRemote": "https://github.com/you/posts-archive.git",
                "postsRepoPath": "/Users/you/posts-archive"
            },
            "blog": {
                "postsGitRemote": "https://github.com/you/blog-posts.git",
                "postsRepoPath": "/Users/you/blog-posts"
            }
        }
    }
    ```

    - Run `node cli/setup.js` again to add another profile. Setup adds profile bin to PATH automatically.

### 2. Link and use

```bash
yarn link
post call   # test
```

## Commands

```bash
post call              # Copy prompt to clipboard
post add <filepath>    # Add doc to posts repo. -d, --delete removes original
post open              # Open posts repo in Cursor
```

## Troubleshooting

**Mac: permission denied on `cli/index.js`**

```bash
chmod +x cli/index.js
```

**Windows: `heymark` not found**

Add Yarn’s global bin to `Path`. In PowerShell (run as needed, then restart the terminal):

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$(yarn global bin)", "User")
```

**Windows: `MODULE_NOT_FOUND` with non-ASCII user path**

If your Windows username contains non-ASCII characters (e.g. Korean), Node/yarn may fail to resolve modules.

1. Move the project to a path without those characters (e.g. `C:\heymark`).
2. Re-link the CLI:

```bash
yarn unlink
yarn link
```

Then run `heymark call` to verify the CLI works.
