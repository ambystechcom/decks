# Ambystech public decks

Slide decks the Ambystech team presents in public, plus the page that lists them. Built with
[Axo](https://github.com/ambystechcom/Axo) and deployed to GitHub Pages by
`.github/workflows/pages.yml`.

```
decks.json              the manifest: site data, categories, and every deck that gets listed
site/                   the listing page's static files (styles, fonts, logos, favicons)
scripts/build.mjs       builds each deck, then renders the listing into dist/
scripts/render.mjs      the listing page markup
<category>/<slug>/      one Axo deck per folder, grouped by category (talks/, lightning/)
```

## Build

```bash
npm run build       # builds every deck in decks.json, then dist/index.html
npm run preview     # serves dist/ at http://localhost:8080
npm run build:site  # re-renders only the listing, reusing already-built decks
```

`npm run build` runs `npm ci` and `npm run build` inside each deck (in CI, or when a deck has
no `node_modules`), copies its `dist/` to `dist/<category>/<slug>/`, and writes the listing.
Everything in `dist/` uses relative URLs, so it works as a project site, a user site, or under
a custom domain.

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
