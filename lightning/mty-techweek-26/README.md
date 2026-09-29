# Tu siguiente usuario es un agente

*Your next user is an agent.* A talk on preparing a product so that AI agents can use it: the
agent acting for your customer never sees your interface, it reads your tools. Four design
rules (the name is the interface, errors teach, retries don't duplicate, least privilege),
then a live demo of the same agent against two fictional ticket platforms: the official box office and a resale site.

- **Event:** Monterrey AI Talks (WebDevTalks Monterrey, 2nd edition), with Monterrey Tech
  Week and Tec de Monterrey. Tuesday 29 September 2026, Expedition FEMSA, Tec Campus MTY.
- **Speaker:** Gustavo Barrientos, CTO, Ambystech
- **Length:** about 27 minutes plus questions
- **Language:** the slides are in Spanish
- **Online:** https://decks.ambystech.io/lightning/mty-techweek-26/

Built with [Axo](https://github.com/ambystechcom/Axo) · **visibility: `public`**

```bash
npm install
npm run dev      # http://localhost:8000
npm run pdf      # -> mty-techweek-26.pdf, the offline backup
npm run build    # -> dist/ (static site)
npm run preview  # check dist/ at :8080
```

## Visibility

This deck is public. The repository's root workflow builds it and deploys it to GitHub Pages
with the listing page on `main`. The PDF is a local step — it drives a headless Chromium,
which is too expensive to run on every push.

Change it in `axo.config.mjs`. It is not a label; it is what the tooling enforces.

## Structure

```
slides/            one .mdx per slide, numbered in presentation order
components/        Eyebrow (override), Cmd/Out (typed terminal lines), Stage (loads the particle stage)
layouts/           cover and closing
css/deck.css       the design system and the per-slide choreography; rules at the top of the file
assets/js/stage.js the particle stage (Three.js) behind every slide
assets/img/        logos and the QR code on the closing slide
assets/vendor/     Three.js r159, Font Awesome (solid + brands) and Carlito, served locally so the deck opens offline
assets/video/      demo.mp4, the recorded backup of the live demo (not committed yet)
axo.config.mjs     title, visibility, footer
```

## Design

Colour carries meaning: fuchsia is what a person sees (screens, UI), cyan is what the agent
reads (tool names, descriptions), muted red with a "—" is the bad version.

The particle stage is one WebGL layer behind the slides. A slide picks a scene with
`attrs: { data-stage: … }` in its frontmatter; anything else gets a dim drift.

| Scene | Slide | What it shows |
|---|---|---|
| `cover` | 01 | a web page dissolves and re-forms as `apartar_asientos(...)`: the thesis of the talk |
| `swarm` | 06 | every particle awake behind "10,000 M" (the number counts up) |
| `read` | 08 | a cyan beam sweeping the tool definition: the agent reading it |
| `split-dim`, `split` | 14, 15 | version A as noise, version B as an ordered grid |
| `orbit` | 19 | a ring around the QR code |

Motion only runs on the slide being shown, and the resting state is the finished drawing:
under `prefers-reduced-motion` and in `npm run pdf` every animation is off and every scene is
drawn once, settled. Three.js is the r159 UMD build (the last with one) because ES modules
do not load over `file://`.

Sequence diagrams (`07b`, `12b`) use `components/Sequence.axo`: inline SVG, so each message
travels when its slide arrives. The Mermaid source of each is kept as a comment in the slide.

The QR code points at the deck's public URL. Regenerate it if the URL changes:

```bash
npx qrcode -t png -w 600 -m 2 -d 0A0D14 -l FFFFFF -o assets/img/qr-deck.png \
  "https://decks.ambystech.io/lightning/mty-techweek-26/"
```

## Before the talk

- Fill slide 16 (`16-marcador.mdx`) with the real numbers from the demo recording. Its cells
  say `TODO` on purpose.
- Record the demo backup and save it as `assets/video/demo.mp4`; the last slide plays it.
