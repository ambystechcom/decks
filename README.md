# Ambystech public decks

Slide decks the Ambystech team presents in public, plus the page that lists them. Built with
[Axo](https://github.com/ambystechcom/Axo) and deployed to GitHub Pages by
`.github/workflows/pages.yml`.

```
decks.json              the manifest: site data, categories, listing copy and every deck
src/                    the listing, an Astro site on @ambystech/ui (pages, components, layout, data)
public/                 favicons, robots.txt
scripts/build.mjs       builds each deck, then the listing, and assembles dist/
scripts/serve.mjs       tiny static server for dist/
<category>/<slug>/      one Axo deck per folder, grouped by category (talks/, lightning/)
```

## Build

```bash
npm run build       # builds every deck, then the Astro listing, into dist/
npm run preview     # serves dist/ at http://localhost:8080
npm run build:site  # listing only, reusing the decks staged in .build/decks
npm run decks       # stage the decks and write src/data/built.json, no listing
npm run dev         # Astro dev server (run `npm run decks` once so the live previews load)
```

`npm run build` runs `npm ci` and `npm run build` inside each deck (in CI, or when a deck has
no `node_modules`), stages its `dist/` in `.build/decks`, runs `astro check` and `astro build`
(which empties `dist/`), then copies the decks into `dist/<category>/<slug>/` and writes the
redirects. Slide counts and last-changed dates come from `src/data/built.json` (generated).
The listing uses the shared header, footer and tokens from `@ambystech/ui`; the deck previews
are live iframes of each deck's first slide.

## Add a deck

1. Scaffold it in its category folder, for example `npx @ambystech/axo new lightning/my-talk`.
2. Set `visibility: "public"` in its `axo.config.mjs`. `axo build` refuses anything else, and
   the workflow will fail with it.
3. Delete the `.github/` folder Axo scaffolds inside the deck. Deployment happens from this
   repository's root workflow.
4. Add an entry to `decks` in `decks.json`. Slide count and the last-changed date are computed
   at build time from the deck's output and git history.

To start a new category, add it to `categories` in `decks.json` with a name, a one-line
description and an accent colour, and put decks under a folder with the same `id`.

Moving a deck to another category changes its URL. List the old path in the deck's
`redirectFrom` (for example `["lightning/mty-techweek-26"]`) and the build writes a redirect
page there, so QR codes and links already shared keep working.

Each entry in a deck's `links` shows as an icon button on the listing: `icon` is `github` or
`docs`, and `label` is what screen readers announce and the tooltip shows.

## Work on a deck

```bash
cd lightning/ambykit
npm install
npm run dev      # http://localhost:8000
npm run pdf      # -> ambykit.pdf, local only
```
