// Renders the listing page. Pure function of the manifest and the built decks.
// All URLs are relative so the site works at any base path (user site, project site, custom domain).

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const monthYear = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const github =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

function renderDeck(deck, site) {
  const src = `${site.urls.repo}/tree/main/${deck.path}`;
  const links = [
    ...deck.links.map((l) => `<a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a>`),
    `<a href="${esc(src)}" rel="noopener">Slides source</a>`,
  ].join('\n            ');

  return `
      <li class="deck" id="${esc(deck.slug)}">
        <a class="preview" href="${esc(deck.path)}" aria-label="Open the ${esc(deck.title)} deck">
          <iframe src="${esc(deck.path)}" title="${esc(deck.title)}, live preview of the first slide" loading="lazy" tabindex="-1" aria-hidden="true" scrolling="no"></iframe>
          <span class="preview-cta" aria-hidden="true">Open deck</span>
        </a>
        <div class="deck-body">
          <h3 class="deck-title"><a href="${esc(deck.path)}">${esc(deck.title)}</a></h3>
          <p class="deck-pitch">${esc(deck.pitch)}</p>
          <p class="deck-summary">${esc(deck.summary)}</p>
          <dl class="facts">
            <div><dt>Speaker</dt><dd>${esc(deck.speaker)}</dd></div>
            <div><dt>Length</dt><dd>${esc(deck.length)}</dd></div>
            <div><dt>Slides</dt><dd>${deck.slides}</dd></div>
            <div><dt>Updated</dt><dd><time datetime="${esc(deck.updated)}">${monthYear(deck.updated)}</time></dd></div>
          </dl>
          <ul class="tags" aria-label="Topics">
            ${deck.tags.map((t) => `<li>${esc(t)}</li>`).join('\n            ')}
          </ul>
          <p class="deck-actions">
            <a class="button" href="${esc(deck.path)}">Open deck</a>
            ${links}
          </p>
        </div>
      </li>`;
}

function renderCategory(cat, decks, site) {
  const items = decks.filter((d) => d.category === cat.id);
  if (!items.length) return '';
  return `
    <section class="shelf" id="${esc(cat.id)}" aria-labelledby="${esc(cat.id)}-title" style="--accent: ${esc(cat.accent)}">
      <div class="wrap shelf-inner">
        <div class="shelf-head">
          <h2 id="${esc(cat.id)}-title">${esc(cat.name)}</h2>
          <p>${esc(cat.blurb)}</p>
        </div>
        <ol class="decks">${items.map((d) => renderDeck(d, site)).join('')}
        </ol>
      </div>
    </section>`;
}

export function renderIndex(manifest, decks) {
  const { site, categories } = manifest;
  const year = new Date().getFullYear();
  const shown = categories.filter((c) => decks.some((d) => d.category === c.id));

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.company,
      legalName: site.legalName,
      url: site.urls.corporate,
      email: site.email,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: site.name,
      itemListElement: decks.map((d, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'PresentationDigitalDocument',
          name: d.title,
          description: d.pitch,
          author: { '@type': 'Person', name: d.speaker },
          dateModified: d.updated,
          inLanguage: 'en',
          url: d.path,
        },
      })),
    },
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(site.name)}</title>
  <meta name="description" content="${esc(site.description)}">
  <meta name="author" content="${esc(site.company)}">
  <meta name="theme-color" content="#0A0D14">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(site.name)}">
  <meta property="og:description" content="${esc(site.description)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:site" content="@ambystechcom">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
  <link rel="preload" href="fonts/files/space-grotesk-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/files/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="fonts/fonts.css">
  <link rel="stylesheet" href="styles.css">
  <script src="ambient.js" defer></script>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <canvas id="ambient-bg" aria-hidden="true"></canvas>

  <header class="top">
    <div class="wrap top-inner">
      <a class="brand" href="./" aria-label="${esc(site.name)}, home">
        <img class="brand-wide" src="assets/ambystech-logo.svg" alt="Ambystech" width="206" height="50">
        <img class="brand-narrow" src="assets/ambystech-mobile.png" alt="Ambystech" width="36" height="36">
        <span class="brand-path">/decks</span>
      </a>
      <nav aria-label="Main">
        <ul>
          ${shown.map((c) => `<li class="nav-cat"><a class="nav-link" href="#${esc(c.id)}">${esc(c.name)}</a></li>`).join('\n          ')}
          <li class="nav-cat"><a class="nav-link" href="${esc(site.urls.oss)}" rel="noopener">Open source</a></li>
          <li><a class="button button-outline" href="${esc(site.urls.repo)}" rel="noopener">${github} GitHub</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="intro wrap" aria-labelledby="intro-title">
      <h1 id="intro-title">Talks we give in public.</h1>
      <p class="lede">Short decks from Ambystech engineers on the tools we build and the way we work. Every deck opens in the browser, needs nothing installed, and is the same file we present from.</p>
      <p class="drive">Inside a deck, move with <kbd>←</kbd> <kbd>→</kbd>, press <kbd>S</kbd> for speaker notes, <kbd>F</kbd> for fullscreen and <kbd>Esc</kbd> for the overview.</p>
    </section>
${shown.map((c) => renderCategory(c, decks, site)).join('\n')}

    <section class="colophon wrap" aria-labelledby="colophon-title">
      <h2 id="colophon-title">Present one yourself</h2>
      <p>Every deck here is built with <a href="${esc(site.urls.oss)}/projects/axo/" rel="noopener">Axo</a>, our static deck framework: slides in MDX, output is plain HTML with no runtime, so it also runs from a USB stick at a venue with no wifi. The source of each deck lives in this site's repository.</p>
      <pre><code><span class="ps">$</span> git clone ${esc(site.urls.repo)}.git
<span class="ps">$</span> cd ${esc(site.urls.repo.split('/').pop())}/${esc(decks[0].path.replace(/\/$/, ''))}
<span class="ps">$</span> npm install <span class="amp">&amp;&amp;</span> npm run dev</code></pre>
    </section>
  </main>

  <footer class="foot">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <img src="assets/ambystech-logo.svg" alt="Ambystech" width="206" height="50">
          <p>Software we craft in the open.</p>
          <p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
        </div>
        <nav aria-label="Decks">
          <h2>Decks</h2>
          <ul>
            ${decks.map((d) => `<li><a href="${esc(d.path)}">${esc(d.title)}</a></li>`).join('\n            ')}
            <li><a href="${esc(site.urls.repo)}" rel="noopener">Source repository</a></li>
          </ul>
        </nav>
        <nav aria-label="Ambystech">
          <h2>Ambystech</h2>
          <ul>
            <li><a href="${esc(site.urls.corporate)}" rel="noopener">ambystech.com</a></li>
            <li><a href="${esc(site.urls.oss)}" rel="noopener">Open source</a></li>
            <li><a href="${esc(site.urls.githubOrg)}" rel="noopener">GitHub</a></li>
          </ul>
        </nav>
      </div>
      <div class="foot-legal">
        <p>© ${year} ${esc(site.company)}. ${esc(site.legalName)}</p>
        <p>Decks are shared for reading. Ask before reusing slides.</p>
      </div>
    </div>
  </footer>

  <script>
    // Each preview is the deck itself at its native 1280x720, scaled to the frame width, so
    // the miniature is a faithful thumbnail. Without JS the iframe simply fills the frame.
    (() => {
      const frames = document.querySelectorAll('.preview iframe');
      if (!frames.length || !('ResizeObserver' in window)) return;
      const fit = (frame) => { frame.style.transform = 'scale(' + frame.parentElement.clientWidth / 1280 + ')'; };
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) fit(entry.target.querySelector('iframe'));
      });
      for (const frame of frames) {
        frame.classList.add('is-scaled');
        fit(frame);
        ro.observe(frame.parentElement);
      }
    })();
  </script>
</body>
</html>
`;
}
