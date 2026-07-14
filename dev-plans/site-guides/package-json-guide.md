---
sidebar_position: 4
title: Mastering package.json for React and Node.js
sidebar_label: package.json Guide
description: Practical best practices for writing clean and production-safe package.json files.
---

# Mastering package.json for React and Node.js

`package.json` is the control center of a JavaScript project. It defines how your app runs, builds, tests, and which dependencies are required.

This guide covers practical fields and conventions for production React and Node.js projects.

## Minimal required fields

Every valid `package.json` must have at least:

```json
{
  "name": "my-app",
  "version": "1.0.0"
}
```

- `name`: use lowercase kebab-case (`my-app`), no spaces.
- `version`: semantic versioning (`major.minor.patch`).

Version examples:

- `1.0.0`: first stable release
- `1.1.0`: backward-compatible features
- `2.0.0`: breaking changes

## Must-have for applications

For apps (not published libraries), set:

```json
{
  "private": true
}
```

This prevents accidental publication to the public npm registry.

## Scripts: automation best practices

Use standard script names so any developer can navigate your project quickly.

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "webpack --mode production",
    "test": "jest",
    "lint": "eslint ."
  }
}
```

### Pre and post scripts

npm supports automatic hooks around scripts.

```json
{
  "scripts": {
    "prebuild": "rm -rf dist",
    "build": "webpack",
    "postbuild": "echo Build completed"
  }
}
```

`prebuild` runs before `build`; `postbuild` runs after it.

## Dependencies vs devDependencies

Keep runtime and tooling strictly separated.

- `dependencies`: required in production runtime.
- `devDependencies`: used only during development and build.

Examples:

- Runtime: `react`, `express`, `axios`, `mongoose`
- Dev tools: `eslint`, `jest`, `nodemon`, `webpack`, `typescript`

Install correctly:

```bash
npm install react
npm install jest --save-dev
```

Short form:

```bash
npm i react
npm i -D jest
```

## React-specific fields

### Proxy (local API development)

If frontend and backend run on different ports locally, set:

```json
{
  "proxy": "http://localhost:5000"
}
```

Then frontend requests like `/api/users` are proxied to your Node API.

### Browserslist

Defines target browsers for tooling (Autoprefixer, Babel, etc.).

```json
{
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

## Node.js-specific fields

### Engines

Lock expected runtime versions for team consistency.

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Module system (`type`)

Use ESM imports/exports in Node.js with:

```json
{
  "type": "module"
}
```

If omitted, Node defaults to CommonJS (`require`).

## Example: production-ready package.json

```json
{
  "name": "pro-dashboard",
  "version": "1.0.0",
  "private": true,
  "description": "Admin dashboard for internal use",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "lint": "eslint . --ext .js,.jsx",
    "format": "prettier --write ."
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "eslint": "^8.48.0",
    "nodemon": "^3.0.1",
    "prettier": "^3.0.2"
  },
  "author": "Yurii <yurii@example.com>",
  "license": "UNLICENSED"
}
```

## Checklist

- [ ] Set `"private": true` for application repos.
- [ ] Keep `dependencies` and `devDependencies` separated.
- [ ] Use standard scripts (`start`, `dev`, `build`, `test`, `lint`).
- [ ] Pin environment expectations with `engines`.
- [ ] Commit `package-lock.json` to Git.
- [ ] Remove unused dependencies regularly.

## Related guides

- [Publishing Your First Website on GitHub](./deploy-guide.md)
- [Beginner's Guide to Node.js and NPM](./nodejs-npm-guide.md)
