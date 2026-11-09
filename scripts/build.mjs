// Builds every deck in decks.json and the Astro listing into dist/.
//
//   node scripts/build.mjs               build decks, then the listing, then assemble dist/
//   node scripts/build.mjs --skip-decks  reuse the decks staged in .build/decks (listing only)
//   node scripts/build.mjs --decks-only  stage the decks and write src/data/built.json, no listing
//
// A deck is an Axo project at <category>/<slug>/. Its own `axo build` enforces visibility;
// this script only assembles what the decks produce. Order matters: `astro build` empties
// dist/, so the decks are staged in .build/decks first and copied in afterwards.

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const stage = join(root, '.build', 'decks');
const builtFile = join(root, 'src', 'data', 'built.json');
const skipDecks = process.argv.includes('--skip-decks');
const decksOnly = process.argv.includes('--decks-only');
const manifest = JSON.parse(readFileSync(join(root, 'decks.json'), 'utf8'));

const sh = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit', shell: true });
const quiet = (cmd, cwd) => {
  try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'], shell: true }).toString().trim(); }
  catch { return ''; }
};

// Relative, so it works at any base path; the hash carries the slide (#/5) across the move.
const redirectPage = (title, to) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title.replace(/[&<>"]/g, '')} (moved)</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${to}">
  <meta http-equiv="refresh" content="0; url=${to}">
  <script>location.replace(${JSON.stringify(to)} + location.hash);</script>
</head>
<body><p>This deck moved to <a href="${to}">a new address</a>.</p></body>
</html>
`;

if (!skipDecks) rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

// 1. Decks -> .build/decks/<category>/<slug>, plus src/data/built.json (slides, updated).
const built = {};
for (const deck of manifest.decks) {
  if (!manifest.categories.some((c) => c.id === deck.category)) throw new Error(`${deck.slug}: unknown category "${deck.category}"`);

  const rel = `${deck.category}/${deck.slug}`;
  const dir = join(root, rel);
  const target = join(stage, rel);
  if (!existsSync(join(dir, 'package.json'))) throw new Error(`${rel}: no package.json, is the deck there?`);

  if (!skipDecks) {
    console.log(`\n== ${rel}`);
    if (process.env.CI || !existsSync(join(dir, 'node_modules'))) sh('npm ci', dir);
    sh('npm run build', dir);
    const dist = join(dir, 'dist');
    if (!existsSync(join(dist, 'index.html'))) throw new Error(`${rel}: build produced no dist/index.html`);
    rmSync(target, { recursive: true, force: true });
    cpSync(dist, target, { recursive: true });
  } else if (!existsSync(join(target, 'index.html'))) {
    throw new Error(`${rel}: .build/decks/${rel}/index.html missing, run without --skip-decks first`);
  }

  const html = readFileSync(join(target, 'index.html'), 'utf8');
  const slides = (html.match(/<!-- \d+[a-z]?-[^>]*\.mdx? -->/g) ?? html.match(/<section\b/g) ?? []).length;
  const updated = quiet(`git log -1 --format=%cs -- "${rel}"`, root) || new Date().toISOString().slice(0, 10);
  built[rel] = { slides, updated };
}
mkdirSync(dirname(builtFile), { recursive: true });
writeFileSync(builtFile, JSON.stringify(built, null, 2) + '\n');

if (decksOnly) {
  console.log(`\nstaged ${Object.keys(built).length} deck(s) in .build/decks`);
  process.exit(0);
}

// 2. The listing (type-checked, then built; this empties dist/).
sh('npx astro check');
sh('npx astro build');

// 3. Decks into dist/, plus redirects for decks that changed category.
for (const deck of manifest.decks) {
  const rel = `${deck.category}/${deck.slug}`;
  cpSync(join(stage, rel), join(out, rel), { recursive: true });
  // A deck that changed category keeps its old URL alive: QR codes and shared links point there.
  for (const old of deck.redirectFrom ?? []) {
    const to = '../'.repeat(old.split('/').length) + `${rel}/`;
    mkdirSync(join(out, old), { recursive: true });
    writeFileSync(join(out, old, 'index.html'), redirectPage(deck.title, to));
  }
}
writeFileSync(join(out, '.nojekyll'), '');

console.log(`\nbuilt dist/ with ${manifest.decks.length} deck${manifest.decks.length === 1 ? '' : 's'}:`);
for (const [rel, b] of Object.entries(built)) console.log(`  ${rel}/  ${b.slides} slides, updated ${b.updated}`);
