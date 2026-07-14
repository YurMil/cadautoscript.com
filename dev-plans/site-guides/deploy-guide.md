---
sidebar_position: 2
title: Publishing Your First Website on GitHub
sidebar_label: GitHub Deployment Guide
description: A step-by-step guide to publishing a static website using VS Code, Git, and GitHub Pages.
---

# Publishing Your First Website on GitHub

Use this guide to publish a simple static website (HTML/CSS) for free with GitHub Pages. It covers the first push via terminal and the day-to-day update flow in VS Code.

## Prerequisites

- Git installed on your computer
- VS Code (Visual Studio Code)
- A GitHub account
- Terminal access (PowerShell, Git Bash, or macOS/Linux terminal)

## 1. Set up SSH access (recommended)

SSH lets you push to GitHub without entering credentials every time.

### 1.1 Generate an SSH key

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- Press `Enter` to accept the default file location.
- Press `Enter` twice to skip passphrase (or set one if you want extra security).

### 1.2 Copy your public key

macOS/Linux or Git Bash on Windows:

```bash
cat ~/.ssh/id_ed25519.pub
```

PowerShell on Windows:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

Copy the full output (it starts with `ssh-ed25519`).

### 1.3 Add the key to GitHub

1. Open GitHub `Settings` -> `SSH and GPG keys`.
2. Click `New SSH key`.
3. Title: for example, `My Laptop`.
4. Key: paste your copied public key.
5. Click `Add SSH key`.

:::tip Success check
Run `ssh -T git@github.com`. If you see `Hi <username>!`, SSH is configured correctly.
:::

## 2. Create a local project

1. Create a folder named `my-first-website`.
2. Open it in VS Code (`File` -> `Open Folder...`).
3. Create `index.html`.
4. Paste this starter file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My First Website</title>
  </head>
  <body>
    <h1>Hello from VS Code!</h1>
    <p>This site is deployed via GitHub Pages.</p>
  </body>
</html>
```

## 3. Create a GitHub repository

1. In GitHub, click `+` -> `New repository`.
2. Repository name: `my-first-website`.
3. Visibility: `Public`.
4. Do **not** initialize with README.
5. Click `Create repository`.

## 4. Connect local project and push first commit

Open terminal in VS Code (`Ctrl + \``) and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:username/my-first-website.git
git push -u origin main
```

Replace `username` with your real GitHub username.

:::warning If `origin` already exists
Use `git remote set-url origin git@github.com:username/my-first-website.git` instead of `git remote add origin ...`.
:::

## 5. Update the site from VS Code UI

After initial setup, you can deploy updates without terminal commands:

1. Edit your file(s), then save.
2. Open `Source Control` (left sidebar).
3. Click `+` to stage changed files.
4. Enter a commit message and click `Commit`.
5. Click `Sync Changes` to push.

## 6. Enable GitHub Pages

1. Open your repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. In `Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/(root)`
4. Click `Save`.

Wait 1-2 minutes. Your site will be available at:
`https://username.github.io/my-first-website/`

## Quick reference

| Action | Terminal | VS Code |
| --- | --- | --- |
| Check changes | `git status` | Source Control panel |
| Stage files | `git add .` | `+` next to file |
| Commit | `git commit -m "msg"` | Commit message + `Commit` |
| Push | `git push` | `Sync Changes` |

## Common issues

- `Permission denied (publickey)`:
  verify SSH setup and test with `ssh -T git@github.com`.
- GitHub Pages shows 404:
  confirm `index.html` exists in repository root on `main` branch.
- Changes are not visible:
  wait a minute and hard-refresh browser cache.

## Next steps

- Add a custom domain in GitHub Pages settings.
- Add a CSS file and split HTML/CSS into separate files.
- If you move to a framework app, add analytics according to your hosting provider documentation.

## Related guides

- [Beginner's Guide to Node.js and NPM](./nodejs-npm-guide.md)
- [Mastering package.json for React and Node.js](./package-json-guide.md)
