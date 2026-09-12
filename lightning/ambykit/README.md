# AmbyKit

Built with [Axo](https://github.com/ambystechcom) · **visibility: `public`**

```bash
npm install
npm run dev      # http://localhost:8000
npm run pdf      # -> ambykit.pdf
npm run build    # -> dist/ (static site)
npm run preview  # check dist/ at :8080
```

## Visibility

This deck is public. It is listed in the repository root `decks.json`, and the root workflow
`.github/workflows/pages.yml` builds it and deploys it to GitHub Pages on `main`. The PDF is a local step — it drives a headless Chromium, which is too
expensive to run on every push.

Change it in `axo.config.mjs`. It is not a label; it is what the tooling enforces.

## Structure

```
slides/         one .mdx per slide   ← what you edit
components/     your .axo components (override a built-in by name)
layouts/        your .axo layouts
css/deck.css    this deck's CSS
axo.config.mjs  title, visibility, footer
```

The compiler, the components, the theme and Reveal all live in `@ambystech/axo`.
Upgrade every deck you own with `npm update @ambystech/axo`.
