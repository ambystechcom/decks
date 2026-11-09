import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const decksDir = resolve('.build/decks');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4' };

// `astro dev` serves the listing only; the decks are built by `npm run decks` into .build/decks.
// This serves them at their final URLs (/talks/<slug>/) so the live previews work in dev too.
const serveDecks = {
  name: 'serve-built-decks',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let file = resolve(join(decksDir, normalize(path)));
      if (!file.startsWith(decksDir) || !existsSync(file)) return next();
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) return next();
      res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
      createReadStream(file).pipe(res);
    });
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://decks.ambystech.io',
  base: '/',
  // Astro 7 defaults to JSX whitespace rules, which drop the spaces between
  // inline elements the templates rely on; keep the v6 compression (same as oss and corporate).
  compressHTML: true,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss(), serveDecks],
  },
});
