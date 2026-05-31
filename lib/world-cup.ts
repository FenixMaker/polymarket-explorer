import {
  translateEvent,
  type PolymarketEvent,
} from './polymarket';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const FIFA_WC_2026_SERIES = 11433;

const EXCLUDE_TITLE = [
  'halftime result',
  'exact score',
  'halftime show',
  'player to make',
  'player to score',
  'most assists',
  'most clean sheets',
  'goal contributions',
  'winless team',
  'unbeaten champion',
  'top goalscorer',
  'top scorer',
  'goalscorer',
  'top scorer (nation)',
  'nation of top goalscorer',
  'knockout stages',
  'team to advance',
  'uefa wc qualifying',
  'qualifying –',
  'qualifying -',
  'club world cup',
  'icc',
  'cricket',
  'chess',
  'fide',
  'fiba',
  'women',
];

function hasFifa2026Description(event: PolymarketEvent): boolean {
  return (event.description || '').toLowerCase().includes('2026 fifa world cup');
}

function isMainMatchTitle(title: string): boolean {
  const t = title.toLowerCase();
  if (!/ vs\.? /i.test(title)) return false;
  return !EXCLUDE_TITLE.some((w) => t.includes(w));
}

function isCuratedCopaMarket(event: PolymarketEvent): boolean {
  const title = event.title || '';
  const t = title.toLowerCase();

  if (EXCLUDE_TITLE.some((w) => t.includes(w))) return false;

  if (/^world cup winner\s*$/i.test(title.trim())) return hasFifa2026Description(event);
  if (/world cup group [a-l] winner/i.test(title)) return hasFifa2026Description(event);
  if (t.includes('which continent will win')) return hasFifa2026Description(event);
  if (t.includes('nation to reach final')) return hasFifa2026Description(event);
  if (t.includes('play in the world cup') && hasFifa2026Description(event)) return true;
  if (t.includes('replace iran') && hasFifa2026Description(event)) return true;

  return false;
}

async function fetchSeriesMatches(): Promise<PolymarketEvent[]> {
  const all: PolymarketEvent[] = [];

  for (let offset = 0; offset < 300; offset += 100) {
    const url = `${GAMMA_API}/events?series_id=${FIFA_WC_2026_SERIES}&active=true&closed=false&limit=100&offset=${offset}`;
    const batch = (await fetch(url, { headers: { Accept: 'application/json' } }).then((r) => r.json())) as PolymarketEvent[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }

  return all.filter((e) => e.active !== false && isMainMatchTitle(e.title));
}

async function fetchCuratedSearchMarkets(): Promise<PolymarketEvent[]> {
  const url = new URL(`${GAMMA_API}/public-search`);
  url.searchParams.set('q', '2026 FIFA World Cup');
  url.searchParams.set('limit_per_type', '50');
  url.searchParams.set('events_status', 'active');
  url.searchParams.set('keep_closed_markets', '0');

  const data = (await fetch(url.toString(), { headers: { Accept: 'application/json' } }).then((r) => r.json())) as {
    events?: PolymarketEvent[];
  };

  return (data.events ?? []).filter((e) => e.active !== false && isCuratedCopaMarket(e));
}

function dedupeEvents(events: PolymarketEvent[]): PolymarketEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

function sortCopaEvents(a: PolymarketEvent, b: PolymarketEvent): number {
  const rank = (e: PolymarketEvent) => {
    const t = e.title.toLowerCase();
    if (/world cup winner/i.test(t)) return 0;
    if (/group [a-l] winner/i.test(t)) return 1;
    if (t.includes('continent')) return 2;
    if (t.includes('reach final')) return 3;
    if (t.includes('play in the world cup')) return 4;
    if (/\s vs\.? /i.test(t)) return 6;
    return 5;
  };
  const dr = rank(a) - rank(b);
  if (dr !== 0) return dr;
  return (b.volume || 0) - (a.volume || 0);
}

export async function fetchWorldCup2026Events(limit = 80): Promise<PolymarketEvent[]> {
  const [matches, curated] = await Promise.all([fetchSeriesMatches(), fetchCuratedSearchMarkets()]);

  return dedupeEvents([...curated, ...matches])
    .map((e) => translateEvent({ ...e, source: 'polymarket' }))
    .sort(sortCopaEvents)
    .slice(0, limit);
}

export { isCuratedCopaMarket, isMainMatchTitle, hasFifa2026Description };
