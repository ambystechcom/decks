// Builds every deck in decks.json and the listing page into dist/.
//
//   node scripts/build.mjs               build decks + listing
//   node scripts/build.mjs --skip-decks  reuse dist/<category>/<slug>/ from a previous run
//
// A deck is an Axo project at <category>/<slug>/. Its own `axo build` enforces visibility;
// this script only assembles what the decks produce.

import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderIndex } from './render.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const skipDecks = process.argv.includes('--skip-decks');
const manifest = JSON.parse(readFileSync(join(root, 'decks.json'), 'utf8'));

const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', shell: true });
const quiet = (cmd, cwd) => {
  try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'], shell: true }).toString().trim(); }
  catch { return ''; }
};

if (!skipDecks) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const built = [];
for (const deck of manifest.decks) {
  const category = manifest.categories.find((c) => c.id === deck.category);
  if (!category) throw new Error(`${deck.slug}: unknown category "${deck.category}"`);

  const rel = `${deck.category}/${deck.slug}`;
  const dir = join(root, rel);
  const target = join(out, rel);
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
    throw new Error(`${rel}: dist/${rel}/index.html missing, run without --skip-decks first`);
  }

  const html = readFileSync(join(target, 'index.html'), 'utf8');
  const slides = (html.match(/<!-- \d+-[^>]*\.mdx? -->/g) ?? html.match(/<section\b/g) ?? []).length;
  const updated = quiet(`git log -1 --format=%cs -- "${rel}"`, root) || new Date().toISOString().slice(0, 10);

  built.push({ ...deck, path: `${rel}/`, slides, updated, accent: category.accent });
}

// Listing page + its static files
cpSync(join(root, 'site'), out, { recursive: true });
writeFileSync(join(out, 'index.html'), renderIndex(manifest, built));
writeFileSync(join(out, '.nojekyll'), '');
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n');

console.log(`\nbuilt dist/ with ${built.length} deck${built.length === 1 ? '' : 's'}:`);
for (const d of built) console.log(`  ${d.path}  ${d.slides} slides, updated ${d.updated}`);
