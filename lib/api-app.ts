import express from 'express';
import { getEventBySlug, getEventById, getPriceHistory, getOrderBook, searchEvents } from './polymarket';
import { getUcdbMarkets, getUcdbMarketById } from './ucdb-markets';
import { fetchWorldCup2026Events } from './world-cup';

const fakeBetsDB: Array<Record<string, unknown>> = [];
const STARTING_BALANCE = 1000;

function getWallet(email: string) {
  const userBets = fakeBetsDB.filter((b) => b.userEmail === email);
  const spent = userBets.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  return {
    balance: STARTING_BALANCE - spent,
    initial: STARTING_BALANCE,
    spent,
    totalBets: userBets.length,
  };
}

export function createApiApp() {
  const app = express();

  app.use(express.json());

  app.get('/api/wallet', (req, res) => {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ error: 'E-mail obrigatório' });
      return;
    }
    res.json(getWallet(email));
  });

  app.post('/api/bets', (req, res) => {
    const bet = req.body;
    const email = bet.userEmail as string;
    if (!email) {
      res.status(400).json({ error: 'Usuário não autenticado' });
      return;
    }
    const amount = Number(bet.amount);
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valor inválido' });
      return;
    }
    const wallet = getWallet(email);
    if (amount > wallet.balance) {
      res.status(400).json({ error: 'Saldo insuficiente', wallet });
      return;
    }
    bet.id = Date.now().toString();
    bet.timestamp = new Date().toISOString();
    bet.potentialReturn = bet.potentialReturn ?? (bet.price > 0 ? Number(bet.amount) / Number(bet.price) : 0);
    bet.status = bet.status ?? 'ativa';
    fakeBetsDB.unshift(bet);
    if (fakeBetsDB.length > 200) fakeBetsDB.pop();
    res.json({ bet, wallet: getWallet(email) });
  });

  app.get('/api/bets', (req, res) => {
    const eventId = req.query.eventId as string;
    const email = req.query.email as string;
    let results = fakeBetsDB;
    if (eventId) results = results.filter((b) => b.eventId === eventId);
    if (email) results = results.filter((b) => b.userEmail === email);
    res.json(results.slice(0, 50));
  });

  app.get('/api/markets', async (req, res) => {
    try {
      const search = (req.query.q as string) || '';
      const category = (req.query.category as string) || 'all';
      const tone = (req.query.tone as string) || 'all';
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 80, 100);

      let events: Awaited<ReturnType<typeof searchEvents>> = [];

      if (category === 'ucdb') {
        events = getUcdbMarkets(search, tone);
      } else if (category === 'copa') {
        events = await fetchWorldCup2026Events(limit);
        if (search) {
          const term = search.toLowerCase();
          events = events.filter(
            (e) =>
              (e.title_pt || e.title).toLowerCase().includes(term) ||
              (e.description_pt || e.description).toLowerCase().includes(term),
          );
        }
      } else {
        const copa = await fetchWorldCup2026Events(limit);
        const ucdb = getUcdbMarkets(search, tone === 'all' ? undefined : tone);
        events = [...ucdb, ...copa];
      }

      res.json(events.slice(0, limit));
    } catch (error) {
      console.error('Error fetching markets:', error);
      res.status(500).json({ error: 'Falha ao buscar mercados' });
    }
  });

  app.get('/api/events/:idOrSlug', async (req, res) => {
    try {
      const id = req.params.idOrSlug;
      const ucdb = getUcdbMarketById(id);
      if (ucdb) {
        res.json(ucdb);
        return;
      }
      let event = await getEventBySlug(id);
      if (!event) event = await getEventById(id);
      if (!event) {
        res.status(404).json({ error: 'Evento não encontrado' });
        return;
      }
      res.json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ error: 'Falha ao buscar evento' });
    }
  });

  app.get('/api/orderbook/:tokenId', async (req, res) => {
    try {
      const book = await getOrderBook(req.params.tokenId);
      if (!book) {
        res.status(404).json({ error: 'Order book indisponível' });
        return;
      }
      res.json(book);
    } catch (error) {
      console.error('Error fetching orderbook:', error);
      res.status(500).json({ error: 'Falha ao buscar order book' });
    }
  });

  app.get('/api/prices/:tokenId', async (req, res) => {
    try {
      const interval = (req.query.interval as '1h' | '6h' | '1d' | '1w' | 'max') || '1d';
      const history = await getPriceHistory(req.params.tokenId, interval);
      res.json({ history });
    } catch (error) {
      console.error('Error fetching price history:', error);
      res.status(500).json({ error: 'Falha ao buscar histórico de preços' });
    }
  });

  return app;
}
