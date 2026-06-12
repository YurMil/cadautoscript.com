---
sidebar_position: 3
title: Beginner's Guide to Node.js and NPM
sidebar_label: Node.js + NPM Basics
description: Practical guide to initializing Node.js projects and managing dependencies with npm.
---

# Beginner's Guide to Node.js and NPM

This guide explains how to install and manage packages in Node.js projects using npm, with practical commands you will use every day.

## Prerequisites

- Node.js installed (npm is included)
- VS Code installed
- Terminal access (PowerShell, Command Prompt, Git Bash, macOS/Linux terminal)

Check your versions:

```bash
node -v
npm -v
```

## 1. Initialize a project

Before installing packages, create a `package.json` file.

```bash
npm init -y
```

What this does:

- Creates `package.json` with default values
- Registers project metadata and dependencies

## 2. Install dependencies

### 2.1 Runtime dependency

Use this for libraries required in production.

```bash
npm install dayjs
```

Short form:

```bash
npm i dayjs
```

Result:

- Adds package to `dependencies` in `package.json`
- Creates/updates `package-lock.json`
- Downloads modules into `node_modules/`

### 2.2 Development dependency

Use this for tooling (linters, test runners, watchers, etc.).

```bash
npm install nodemon --save-dev
```

Short form:

```bash
npm i -D nodemon
```

Result:

- Adds package to `devDependencies`

## 3. Use an installed library

Create `index.js`:

```js
const dayjs = require('dayjs');

const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
console.log('Current time:', now);
```

Run it:

```bash
node index.js
```

## 4. Global packages

Install globally only when you need a CLI command available system-wide.

```bash
npm install -g typescript
```

:::warning
Avoid global installs for project-specific tooling. Prefer local dev dependencies plus `npx`.
:::

## 5. Essential npm commands

### Remove a package

```bash
npm uninstall dayjs
```

### Update packages (within allowed semver range)

```bash
npm update
```

### Install dependencies from `package.json`

```bash
npm install
```

Use this after cloning a repository.

## 6. Useful VS Code workflow

1. Open the integrated terminal (`Ctrl + \``) in the project root.
2. Use the `NPM SCRIPTS` panel to run scripts from `package.json`.
3. Use IntelliSense for `import`/`require` suggestions from installed packages.

## Quick reference

| Goal | Command | Short form |
| --- | --- | --- |
| Initialize project | `npm init -y` | - |
| Install dependency | `npm install <name>` | `npm i <name>` |
| Install dev dependency | `npm install <name> --save-dev` | `npm i -D <name>` |
| Install global package | `npm install -g <name>` | - |
| Remove dependency | `npm uninstall <name>` | `npm un <name>` |
| Install from lockfile/package.json | `npm install` | `npm i` |
| Run script | `npm run <script>` | - |

## Common mistakes

- Committing `node_modules/` to Git.
- Installing everything globally.
- Forgetting to run `npm install` after cloning a project.
- Editing `package-lock.json` manually.

## Next steps

- Learn `package.json` scripts (`build`, `dev`, `test`).
- Learn `npx` for running local binaries.
- Add linting and formatting (`eslint`, `prettier`) as dev dependencies.

## Related guides

- [Publishing Your First Website on GitHub](./deploy-guide.md)
- [Mastering package.json for React and Node.js](./package-json-guide.md)
