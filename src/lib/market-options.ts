import { Market, PolymarketEvent } from '../types';

export interface MarketOption {
  id: string;
  label: string;
  probability: number;
  market: Market;
}

const SKIP_LABEL = /^(other|team [a-z]{1,3})$/i;

const CONTINENT_PT: Record<string, string> = {
  'North America': 'América do Norte',
  'South America': 'América do Sul',
  Europe: 'Europa',
  Asia: 'Ásia',
  Africa: 'África',
  Oceania: 'Oceania',
};

function parseYesNoMarket(market: Market): { isYesNo: boolean; yesPrice: number } {
  try {
    const outcomes = JSON.parse(market.outcomes || '[]') as string[];
    const prices = JSON.parse(market.outcomePrices || '[]').map(Number);
    const yesIdx = outcomes.findIndex((o) => o === 'Yes');
    if (yesIdx >= 0 && outcomes.includes('No')) {
      return { isYesNo: true, yesPrice: prices[yesIdx] ?? 0 };
    }
    return { isYesNo: false, yesPrice: 0 };
  } catch {
    return { isYesNo: false, yesPrice: 0 };
  }
}

/** Eventos Polymarket com vários sub-mercados (ex.: um por seleção/time). */
export function isMultiChoiceEvent(event: PolymarketEvent): boolean {
  const markets = event.markets ?? [];
  if (markets.length <= 1) return false;
  const yesNoCount = markets.filter((m) => parseYesNoMarket(m).isYesNo).length;
  return yesNoCount >= 2;
}

function translateLabel(label: string): string {
  if (CONTINENT_PT[label]) return CONTINENT_PT[label];
  if (/^draw\b/i.test(label)) return 'Empate';
  return label;
}

function extractSelectionLabel(market: Market): string {
  if (market.groupItemTitle) return translateLabel(market.groupItemTitle);

  const q = market.question || '';
  if (/end in a draw|empate/i.test(q)) {
    const dm = q.match(/Draw \((.+?)\)/i);
    return dm ? `Empate (${dm[1]})` : 'Empate';
  }

  const patterns = [
    /^Will (.+?) win on \d/i,
    /^Will (.+?) win the \d/i,
    /^Will (.+?) win Group /i,
    /^Will (.+?) win the World Cup/i,
    /^Will (.+?) play in the/i,
    /^Will (.+?) win\?/i,
  ];
  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match) return translateLabel(match[1].trim());
  }

  return market.question_pt || market.question;
}

/** Lista opções reais (times, continentes, empate…) com probabilidade. */
export function getEventOptions(event: PolymarketEvent, limit?: number): MarketOption[] {
  if (!isMultiChoiceEvent(event)) {
    const m = event.markets?.[0];
    if (!m?.outcomePrices) return [];
    try {
      const outcomes = JSON.parse(m.outcomes_pt || m.outcomes || '[]') as string[];
      const prices = JSON.parse(m.outcomePrices || '[]').map(Number);
      return outcomes.map((label, i) => ({
        id: m.id,
        label,
        probability: prices[i] ?? 0,
        market: m,
      }));
    } catch {
      return [];
    }
  }

  const options: MarketOption[] = [];
  for (const m of event.markets ?? []) {
    const { isYesNo, yesPrice } = parseYesNoMarket(m);
    if (!isYesNo) continue;
    const label = extractSelectionLabel(m);
    if (!label || SKIP_LABEL.test(label)) continue;
    if (!m.outcomePrices) continue;

    options.push({
      id: m.id,
      label,
      probability: yesPrice,
      market: m,
    });
  }

  options.sort((a, b) => b.probability - a.probability);
  return limit ? options.slice(0, limit) : options;
}

export function getTopOption(event: PolymarketEvent): MarketOption | null {
  return getEventOptions(event, 1)[0] ?? null;
}

export function getOptionCountLabel(event: PolymarketEvent): string | null {
  if (!isMultiChoiceEvent(event)) return null;
  const total = getEventOptions(event).length;
  if (total <= 3) return null;
  return `${total} opções`;
}
