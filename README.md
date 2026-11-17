# GitHub Diff: Collapse Test Files

A Chrome extension that collapses test and fixture files on the pull request diff pages of `github.com`.

A file collapses when its path matches an enabled glob.
Click the extension icon to add, remove, turn off or reset the globs.
The list lives in `chrome.storage.sync`, and changes apply the next time a pull request page loads.

The default globs are:

- `**/*.{test,spec}.{js,ts,jsx,tsx}`
- `**/test/**`
- `**/__test__/**`, `**/__tests__/**`
- `**/__fixture__/**`, `**/__fixtures__/**`

Each file collapses once per page, so a file you expand stays expanded.

## Build

The project uses [Vite+](https://viteplus.dev/), React, Tailwind and shadcn/ui.

```bash
npm install
```

```bash
npm run build
```

`npm run dev` rebuilds `dist/` on every change.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Press **Load unpacked** and pick the `dist` folder.

After a rebuild, press the reload icon on the extension's card and reload the GitHub tab.

## Check

```bash
npm run check
```

```bash
npm test
```
