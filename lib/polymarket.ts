const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

export interface PolymarketMarket {
  id: string;
  question: string;
  question_pt?: string;
  outcomes: string;
  outcomes_pt?: string;
  outcomePrices: string;
  volume: string;
  liquidity: string;
  clobTokenIds?: string;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  groupItemTitle?: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  title_pt?: string;
  description: string;
  description_pt?: string;
  image: string;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  commentCount: number;
  active: boolean;
  slug?: string;
  source?: 'polymarket' | 'ucdb';
  tone?: 'engraçada' | 'seria' | 'intermediaria';
  markets: PolymarketMarket[];
}

export interface PriceHistoryPoint {
  t: number;
  p: number;
}

const PT_TO_EN: Record<string, string[]> = {
  'copa do mundo': ['fifa world cup 2026'],
  copa: ['fifa world cup 2026'],
  ucdb: ['ucdb'],
  futebol: ['soccer', 'champions league'],
  eleição: ['election', 'president'],
  eleicao: ['election', 'president'],
};

export function isFifaWorldCupEvent(event: PolymarketEvent): boolean {
  const text = `${event.title} ${event.description}`.toLowerCase();
  if (!text.includes('2026 fifa world cup') && !/ vs\.? /i.test(event.title)) return false;
  const exclude = [
    'cricket', 'icc', 't20', 'qualifying', 'women', 'player to make', 'squad',
    'mlb', 'nba', 'nfl', 'club world cup', 'chess', 'fide', 'fiba', 'halftime show',
    'exact score', 'halftime result', 'uefa wc',
  ];
  return !exclude.some((w) => text.includes(w));
}

function translateText(text: string): string {
  if (!text) return text;
  let t = text
    .replace(/This market will resolve according to the team that wins Group ([A-Z]) in the 2026 FIFA World Cup[^.]*\./gi,
      'Este mercado será resolvido conforme o time que vencer o Grupo $1 na Copa do Mundo FIFA 2026.')
    .replace(/This market will resolve according to[^.]*\./gi, 'Este mercado será resolvido conforme os critérios oficiais do evento.')
    .replace(/Will (.+) win the (.+)\?/gi, 'O $1 vencerá a $2?')
    .replace(/Will (.+) win Group (.+) in the 2026 FIFA World Cup\?/gi, 'A $1 vencerá o Grupo $2 na Copa do Mundo FIFA 2026?')
    .replace(/Will (.+) play in the (.+)\?/gi, 'O $1 jogará na $2?')
    .replace(/Which continent will win the (.+)\?/gi, 'Qual continente vencerá a $1?')
    .replace(/Which team will replace Iran at World Cup\?/gi, 'Qual seleção substituirá o Irã na Copa do Mundo?')
    .replace(/Nation to Reach Final/gi, 'Seleção na final')
    .replace(/World Cup Winner/gi, 'Campeão da Copa do Mundo')
    .replace(/Will (.+) Play in the World Cup\?/gi, 'A seleção $1 disputará a Copa do Mundo?')
    .replace(/WIll (.+) play in the World Cup\?/gi, 'O $1 jogará na Copa do Mundo?')
    .replace(/Will (.+) play in the World Cup\?/gi, 'O $1 jogará na Copa do Mundo?')
    .replace(/ vs\. /g, ' x ')
    .replace(/ vs /g, ' x ')
    .replace(/FIFA World Cup/gi, 'Copa do Mundo FIFA')
    .replace(/World Cup/gi, 'Copa do Mundo')
    .replace(/Who will win/gi, 'Quem vencerá')
    .replace(/Next (.+) Champion/gi, 'Próximo Campeão da $1')
    .replace(/Group ([A-Z]) Winner/gi, 'Vencedor do Grupo $1')
    .replace(/\bWinner\b/gi, 'Vencedor')
    .replace(/\bplay in\b/gi, 'jogar na')
    .replace(/The primary resolution source/gi, 'Fonte principal de resolução')
    .replace(/official information from FIFA/gi, 'informações oficiais da FIFA')
    .replace(/scheduled for/gi, 'previsto para')
    .replace(/group stage/gi, 'fase de grupos');
  return t;
}
export function resolveSearchQuery(query: string): string {
  const term = query.toLowerCase().trim();
  if (term.includes('ucdb')) return 'ucdb';
  for (const [pt, enTerms] of Object.entries(PT_TO_EN)) {
    if (term.includes(pt)) return enTerms[0];
  }
  return query.trim();
}

function translateOutcome(outcome: string): string {
  if (outcome === 'Yes') return 'Sim';
  if (outcome === 'No') return 'Não';
  return outcome;
}

export function translateEvent(event: PolymarketEvent): PolymarketEvent {
  const translated: PolymarketEvent = {
    ...event,
    title_pt: translateText(event.title),
    description_pt: translateText(event.description),
    markets: event.markets?.map((m) => {
      const market = { ...m, question_pt: translateText(m.question) };
      if (m.outcomes) {
        try {
          const parsed = JSON.parse(m.outcomes) as string[];
          market.outcomes_pt = JSON.stringify(parsed.map(translateOutcome));
        } catch {
          /* keep original */
        }
      }
      return market;
    }) ?? [],
  };
  return translated;
}

export async function searchEvents(query: string, limit = 50): Promise<PolymarketEvent[]> {
  const searchTerm = resolveSearchQuery(query);
  const url = new URL(`${GAMMA_API}/public-search`);
  url.searchParams.set('q', searchTerm);
  url.searchParams.set('limit_per_type', String(Math.min(limit, 50)));
  url.searchParams.set('events_status', 'active');
  url.searchParams.set('keep_closed_markets', '0');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Gamma API error: ${response.status}`);
  }

  const data = (await response.json()) as { events?: PolymarketEvent[] };
  const events = data.events ?? [];

  return events
    .filter((e) => e.active !== false)
    .filter(isFifaWorldCupEvent)
    .map(translateEvent)
    .slice(0, limit);
}

export async function getEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  const response = await fetch(`${GAMMA_API}/events/slug/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return null;
  const event = (await response.json()) as PolymarketEvent;
  return translateEvent(event);
}

export async function getEventById(id: string): Promise<PolymarketEvent | null> {
  const response = await fetch(`${GAMMA_API}/events/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const event = (await response.json()) as PolymarketEvent;
  return translateEvent(event);
}

export async function getOrderBook(tokenId: string) {
  const url = `${CLOB_API}/book?token_id=${encodeURIComponent(tokenId)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  return response.json() as Promise<{ bids: { price: string; size: string }[]; asks: { price: string; size: string }[] }>;
}

export async function getPriceHistory(
  tokenId: string,
  interval: '1h' | '6h' | '1d' | '1w' | 'max' = '1d',
): Promise<PriceHistoryPoint[]> {
  const url = new URL(`${CLOB_API}/prices-history`);
  url.searchParams.set('market', tokenId);
  url.searchParams.set('interval', interval);
  url.searchParams.set('fidelity', '60');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return [];
  const data = (await response.json()) as { history?: PriceHistoryPoint[] };
  return data.history ?? [];
}
