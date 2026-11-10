import manifest from '../../decks.json';

// Written by scripts/build.mjs: slide count and last-changed date per deck. Missing during a
// bare `astro dev` before the first `npm run decks`, so every field has a fallback.
const builtFiles = import.meta.glob<{ default: Record<string, { slides?: number; updated?: string }> }>('./built.json', { eager: true });
const built = Object.values(builtFiles)[0]?.default ?? {};

export const site = manifest.site;
export const ui = manifest.ui;

export interface Deck {
  slug: string;
  category: string;
  title: string;
  pitch: string;
  description: string;
  event: string;
  speaker: string;
  length: string;
  language: string;
  lang: 'en' | 'es';
  tags: string[];
  links: { label: string; icon: string; href: string }[];
  date?: string;
  /** Site-relative URL of the built deck, e.g. /talks/mty-techweek-26/ */
  path: string;
  slides: number | null;
  updated: string | null;
  /** The date shown in the meta grid: label and value. */
  when: { label: string; value: string; iso: string | null };
  /** "ES" or "EN": the filter key and the pill text. */
  code: 'ES' | 'EN';
}

const fmt = (iso: string, withDay: boolean) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en', { month: 'short', year: 'numeric', ...(withDay ? { day: 'numeric' } : {}), timeZone: 'UTC' });

export const decks: Deck[] = (manifest.decks as unknown as Omit<Deck, 'path' | 'slides' | 'updated' | 'when' | 'code'>[]).map((d) => {
  const b = built[`${d.category}/${d.slug}`] ?? {};
  const updated = b.updated ?? null;
  const when = d.date
    ? { label: 'DATE', value: fmt(d.date, true), iso: d.date }
    : { label: 'UPDATED', value: updated ? fmt(updated, false) : 'n/a', iso: updated };
  return { ...d, path: `/${d.category}/${d.slug}/`, slides: b.slides ?? null, updated, when, code: d.lang === 'es' ? 'ES' : 'EN' };
});

export const categories = manifest.categories.map((c) => ({ ...c, decks: decks.filter((d) => d.category === c.id) }));

/** The newest dated talk; falls back to the first deck. */
export const latest: Deck | undefined =
  [...decks].filter((d) => d.date).sort((a, b) => b.date!.localeCompare(a.date!))[0] ?? decks[0];
