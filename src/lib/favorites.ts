import { PolymarketEvent } from '../types';
import { getMainPrice } from './market-utils';

const KEY = 'arena_favorites';
const PRICES_KEY = 'arena_fav_prices';

export type FavoriteEntry = {
  id: string;
  title: string;
  source: 'polymarket' | 'ucdb';
  price: number;
  savedAt: string;
};

export function getFavorites(): FavoriteEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((f) => f.id === id);
}

export function toggleFavorite(event: PolymarketEvent, price: number): boolean {
  const list = getFavorites();
  const idx = list.findIndex((f) => f.id === event.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(KEY, JSON.stringify(list));
    return false;
  }
  list.push({
    id: event.id,
    title: event.title_pt || event.title,
    source: event.source || 'polymarket',
    price,
    savedAt: new Date().toISOString(),
  });
  localStorage.setItem(KEY, JSON.stringify(list));
  return true;
}

export function getStoredPrices(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PRICES_KEY) || '{}');
  } catch {
    return {};
  }
}

export function updateStoredPrices(events: PolymarketEvent[]): { id: string; title: string; oldPrice: number; newPrice: number; change: number }[] {
  const favs = getFavorites();
  const stored = getStoredPrices();
  const alerts: { id: string; title: string; oldPrice: number; newPrice: number; change: number }[] = [];
  const next = { ...stored };

  for (const fav of favs) {
    const ev = events.find((e) => e.id === fav.id);
    if (!ev) continue;
    const price = getMainPrice(ev);
    const old = stored[fav.id] ?? fav.price;
    next[fav.id] = price;
    const change = old > 0 ? Math.abs((price - old) / old) * 100 : 0;
    if (change >= 5 && stored[fav.id] !== undefined) {
      alerts.push({ id: fav.id, title: fav.title, oldPrice: old, newPrice: price, change });
    }
  }

  localStorage.setItem(PRICES_KEY, JSON.stringify(next));
  return alerts;
}
