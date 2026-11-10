# CLAUDE.md

Ambystech public decks: Axo decks in `<category>/<slug>/` plus the decks.ambystech.io listing (Astro 7, Tailwind 4, `@ambystech/ui` pinned by tag like the `oss` and `corporate` sites).

## Commands
`npm run build` (decks + `astro check` + `astro build` -> `dist/`), `npm run build:site` (listing only), `npm run decks` then `npm run dev`, `npm run preview`.

## Gotchas
- `astro build` empties `dist/`, so `scripts/build.mjs` stages decks in `.build/decks` and copies them in afterwards. `astro dev` serves `.build/decks` via a Vite plugin in `astro.config.mjs`.
- `src/data/built.json` (slides, updated) is generated and gitignored; `src/data/decks.ts` falls back when it is missing.
- The listing copy and the deck list live in `decks.json`; the design source is the Ambystech Canvas page "23 — Decks". Decks and their iframe previews are not part of that redesign.
- Keep `compressHTML: true` in `astro.config.mjs` (same as oss/corporate). Tailwind needs the `@source` line for the UI package in `src/styles/global.css`.
- Axo's scaffolded deck `.gitignore` lists `vendor/`; anchor it (`/vendor/`) so hand-vendored `assets/vendor/` isn't swallowed. Check `git check-ignore` before committing new deck assets.
- Windows: a running `axo dev` holds its deck folder; stop it before moving or deleting that folder.
- Pushing `main` deploys to GitHub Pages.
