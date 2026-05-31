import { PolymarketEvent } from '../types';
import { getTopOption, isMultiChoiceEvent, getEventOptions } from './market-options';

export type MarketKind = 'campeao' | 'grupo' | 'jogo' | 'outro';
export type SortKey = 'volume' | 'liquidez' | 'probabilidade';

export function getMarketKind(event: PolymarketEvent): MarketKind {
  const t = (event.title_pt || event.title).toLowerCase();
  if (t.includes('campeão') || /world cup winner/i.test(event.title)) return 'campeao';
  if (/grupo [a-l]/i.test(t) || /group [a-l] winner/i.test(event.title)) return 'grupo';
  if (/ x | vs\.? /i.test(t)) return 'jogo';
  return 'outro';
}

export function getMarketGroup(event: PolymarketEvent): string | null {
  const t = event.title_pt || event.title;
  const m = t.match(/grupo ([A-L])/i) || t.match(/group ([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

export function getTeamsFromTitle(event: PolymarketEvent): string[] {
  const t = event.title_pt || event.title;
  const match = t.match(/^(.+?) x (.+?)$/i);
  if (!match) return [];
  return [match[1].trim(), match[2].trim()];
}

export function calcPotentialReturn(amount: number, price: number): number {
  if (!price || price <= 0) return 0;
  return amount / price;
}

export function calcProfit(amount: number, price: number): number {
  return calcPotentialReturn(amount, price) - amount;
}

export function getMainPrice(event: PolymarketEvent): number {
  if (isMultiChoiceEvent(event)) {
    return getTopOption(event)?.probability ?? 0;
  }
  const m = event.markets?.[0];
  if (!m?.outcomePrices) return 0;
  try {
    const prices = JSON.parse(m.outcomePrices) as string[];
    return parseFloat(prices[0] || '0');
  } catch {
    return 0;
  }
}

export function filterAndSortEvents(
  events: PolymarketEvent[],
  opts: {
    kind?: MarketKind | 'all';
    group?: string | 'all';
    team?: string;
    sort?: SortKey;
  },
): PolymarketEvent[] {
  let list = [...events];

  if (opts.kind && opts.kind !== 'all') {
    list = list.filter((e) => getMarketKind(e) === opts.kind);
  }
  if (opts.group && opts.group !== 'all') {
    list = list.filter((e) => getMarketGroup(e) === opts.group);
  }
  if (opts.team?.trim()) {
    const term = opts.team.toLowerCase();
    list = list.filter((e) => {
      const t = (e.title_pt || e.title).toLowerCase();
      if (t.includes(term)) return true;
      return getEventOptions(e).some((o) => o.label.toLowerCase().includes(term));
    });
  }

  const sort = opts.sort || 'volume';
  list.sort((a, b) => {
    if (sort === 'volume') return (b.volume || 0) - (a.volume || 0);
    if (sort === 'liquidez') return (b.liquidity || 0) - (a.liquidity || 0);
    return getMainPrice(b) - getMainPrice(a);
  });

  return list;
}

export function getPolymarketUrl(event: PolymarketEvent): string | null {
  if (event.source === 'ucdb') return null;
  if (event.slug) return `https://polymarket.com/event/${event.slug}`;
  const m = event.markets?.[0];
  if (m?.slug) return `https://polymarket.com/event/${m.slug}`;
  return `https://polymarket.com/search?q=${encodeURIComponent(event.title)}`;
}

export const MARKET_GLOSSARY = {
  volume: 'Total negociado neste mercado em dólares.',
  liquidez: 'Quanto dinheiro está disponível para entrar/sair de posições agora.',
  probabilidade: 'Preço da cota = probabilidade implícita de o evento ocorrer (ex.: 28% = US$ 0,28).',
};
