import React, { useState, useEffect } from 'react';
import { PolymarketEvent, UserBet } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUserPhotoURL } from '../lib/user';
import confetti from 'canvas-confetti';
import { ExternalLink, Star } from 'lucide-react';
import { calcPotentialReturn, calcProfit, getPolymarketUrl, getTeamsFromTitle, getMainPrice } from '../lib/market-utils';
import { getEventOptions, isMultiChoiceEvent } from '../lib/market-options';
import { isFavorite, toggleFavorite } from '../lib/favorites';
import { placeBet as placeFirestoreBet, voteUcdb, getUcdbVotes, getEventBets } from '../services/firestore-db';
import { SourceBadge } from './HelpTip';

interface EventDetailsProps {
  event: PolymarketEvent | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onBetPlaced?: () => void;
  onFavoriteChange?: () => void;
}

interface ChartPoint {
  time: string;
  yes: number;
  no?: number;
}

interface OrderBookLevel {
  price: string;
  size: string;
}

export function EventDetails({ event, isOpen, onClose, user, onBetPlaced, onFavoriteChange }: EventDetailsProps) {
  const [bets, setBets] = useState<UserBet[]>([]);
  const [betAmount, setBetAmount] = useState('10');
  const [isBetting, setIsBetting] = useState(false);
  const [historyData, setHistoryData] = useState<ChartPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] } | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [ucdbVotes, setUcdbVotes] = useState({ sim: 0, nao: 0, total: 0 });
  const [voting, setVoting] = useState(false);
  const [optionSearch, setOptionSearch] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      setOptionSearch('');
      setFavorited(isFavorite(event.id));
      fetchBets();
      fetchPriceHistory();
      fetchOrderBook();
      if (event.source === 'ucdb') {
        getUcdbVotes(event.id).then(setUcdbVotes).catch(console.error);
      }
    }
  }, [isOpen, event]);

  const fetchOrderBook = async () => {
    const refMarket = getEventOptions(event!)[0]?.market ?? event?.markets?.[0];
    if (!refMarket?.clobTokenIds || event?.source === 'ucdb') {
      setOrderBook(null);
      return;
    }
    try {
      const tokenIds: string[] = JSON.parse(refMarket.clobTokenIds);
      const res = await fetch(`/api/orderbook/${tokenIds[0]}`);
      if (res.ok) setOrderBook(await res.json());
    } catch {
      setOrderBook(null);
    }
  };

  const fetchPriceHistory = async () => {
    const refMarket = getEventOptions(event!)[0]?.market ?? event?.markets?.[0];
    if (!refMarket?.clobTokenIds) {
      setHistoryData(buildFallbackHistory(event));
      return;
    }

    setLoadingHistory(true);
    try {
      const tokenIds: string[] = JSON.parse(refMarket.clobTokenIds);
      const yesToken = tokenIds[0];
      const res = await fetch(`/api/prices/${yesToken}?interval=1d`);
      if (!res.ok) throw new Error('history unavailable');
      const { history } = await res.json() as { history: { t: number; p: number }[] };

      if (history?.length > 0) {
        const sampled = sampleHistory(history, 24);
        setHistoryData(
          sampled.map((pt) => ({
            time: new Date(pt.t * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            yes: Math.round(pt.p * 100),
            no: Math.round((1 - pt.p) * 100),
          })),
        );
      } else {
        setHistoryData(buildFallbackHistory(event));
      }
    } catch {
      setHistoryData(buildFallbackHistory(event));
    } finally {
      setLoadingHistory(false);
    }
  };

  const sampleHistory = (history: { t: number; p: number }[], maxPoints: number) => {
    if (history.length <= maxPoints) return history;
    const step = Math.floor(history.length / maxPoints);
    return history.filter((_, i) => i % step === 0 || i === history.length - 1);
  };

  const buildFallbackHistory = (ev: PolymarketEvent | null): ChartPoint[] => {
    const main = ev?.markets?.[0];
    let yes = 50;
    let no = 50;
    if (main) {
      try {
        const prices = JSON.parse(main.outcomePrices || '[]').map((p: string) => parseFloat(p));
        yes = Math.round((prices[0] ?? 0.5) * 100);
        no = Math.round((prices[1] ?? 0.5) * 100);
      } catch { /* noop */ }
    }
    return [
      { time: '7D', yes: yes - 5, no: no + 5 },
      { time: '5D', yes: yes - 2, no: no + 2 },
      { time: '3D', yes: yes + 1, no: no - 1 },
      { time: 'Agora', yes, no },
    ];
  };

  const fetchBets = async () => {
    if (!event) return;
    try {
      const data = await getEventBets(event.id);
      setBets(data);
    } catch (e) {
      console.error(e);
      setBets([]);
    }
  };

  if (!event) return null;

  const multi = isMultiChoiceEvent(event);
  const allOptions = getEventOptions(event);
  const options = optionSearch.trim()
    ? allOptions.filter((o) => o.label.toLowerCase().includes(optionSearch.toLowerCase()))
    : allOptions;

  const teams = getTeamsFromTitle(event);
  const polyUrl = getPolymarketUrl(event);
  const amountNum = parseFloat(betAmount) || 0;
  const userBets = user ? bets.filter((b) => b.userEmail === user.email) : [];
  const totalUserBets = userBets.length;
  const totalUserAmount = userBets.reduce((sum, b) => sum + b.amount, 0);

  const baseVolume = event.volume || 1000;
  const volumeData = [
    { time: '1D', vol: baseVolume * 0.5 },
    { time: '12H', vol: baseVolume * 0.7 },
    { time: '6H', vol: baseVolume * 0.85 },
    { time: 'Agora', vol: baseVolume },
  ];

  const handleToggleFavorite = () => {
    const price = getMainPrice(event);
    const nowFav = toggleFavorite(event, price);
    setFavorited(nowFav);
    onFavoriteChange?.();
  };

  const handleUcdbVote = async (vote: 'sim' | 'nao') => {
    if (!user?.uid) {
      alert('Faça login para votar.');
      return;
    }
    setVoting(true);
    try {
      const counts = await voteUcdb(event.id, user.uid, vote);
      setUcdbVotes({ ...counts, total: counts.sim + counts.nao });
    } catch {
      alert('Enquete indisponível no momento.');
    } finally {
      setVoting(false);
    }
  };

  const handleBet = async (outcome: string, price: number, marketId: string) => {
    if (!user?.uid) {
      alert('Faça login para apostar.');
      return;
    }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;

    const potentialReturn = calcPotentialReturn(amount, price);
    const betPayload = {
      eventId: event.id,
      eventTitle: `${event.title_pt || event.title} — ${outcome}`,
      marketId,
      userEmail: user.email!,
      userName: user.displayName || 'Anônimo',
      photoURL: getUserPhotoURL(user) || undefined,
      outcome,
      amount,
      price,
      potentialReturn,
      status: 'ativa' as const,
    };

    setIsBetting(true);
    try {
      await placeFirestoreBet(user.uid, betPayload);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setBetAmount('10');
      fetchBets();
      onBetPlaced?.();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Erro ao apostar. Verifique o Firestore.');
    } finally {
      setIsBetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[min(96vw,80rem)] !w-[96vw] !max-h-[94dvh] p-0 rounded-md sm:rounded-lg border-border/60 flex flex-col gap-0">
        <div className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50">
          <DialogHeader>
            <div className="flex gap-4 items-start pr-8">
              {event.image ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-sm border overflow-hidden shrink-0 bg-muted">
                  <img src={event.image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-sm border shrink-0 bg-muted flex items-center justify-center text-2xl">
                  {event.source === 'ucdb' ? '🎓' : '⚽'}
                </div>
              )}
              <div className="py-0.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <SourceBadge source={event.source} />
                  <button type="button" onClick={handleToggleFavorite} className="p-1 hover:scale-110 transition-transform">
                    <Star size={16} className={favorited ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                  </button>
                  {polyUrl && (
                    <a
                      href={polyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-primary hover:underline ml-auto"
                    >
                      Ver na Polymarket <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <DialogTitle className="text-lg sm:text-xl leading-snug text-left font-semibold">
                  {event.title_pt || event.title}
                </DialogTitle>
                {teams.length === 2 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Confronto: <strong>{teams[0]}</strong> vs <strong>{teams[1]}</strong>
                  </p>
                )}
                <DialogDescription className="mt-2 text-left text-sm leading-relaxed max-h-32 overflow-y-auto">
                  {event.description_pt || event.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pb-6 pt-4">
          {event.source === 'ucdb' && (
            <div className="mb-5 p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm font-medium mb-2">Enquete UCDB — você acredita que vai acontecer?</p>
              <div className="flex gap-2 mb-2">
                <Button size="sm" variant="outline" className="rounded-md" disabled={voting} onClick={() => handleUcdbVote('sim')}>
                  Sim ({ucdbVotes.sim})
                </Button>
                <Button size="sm" variant="outline" className="rounded-md" disabled={voting} onClick={() => handleUcdbVote('nao')}>
                  Não ({ucdbVotes.nao})
                </Button>
              </div>
              {ucdbVotes.total > 0 && (
                <p className="text-xs text-muted-foreground">{ucdbVotes.total} votos · {Math.round((ucdbVotes.sim / ucdbVotes.total) * 100)}% acreditam que sim</p>
              )}
            </div>
          )}

          <Tabs defaultValue="overview" className="mt-0">
            <TabsList className="grid w-full grid-cols-3 p-0.5 bg-muted/40 rounded-md mb-5 h-auto">
              <TabsTrigger value="overview" className="rounded-sm py-2 text-xs sm:text-sm">Visão geral</TabsTrigger>
              <TabsTrigger value="chart" className="rounded-sm py-2 text-xs sm:text-sm">Gráficos</TabsTrigger>
              <TabsTrigger value="book" className="rounded-sm py-2 text-xs sm:text-sm">Order book</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-0">
              {user && totalUserBets > 0 && (
                <div className="bg-muted/40 border border-border p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Suas apostas neste mercado</p>
                    <p className="text-2xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(totalUserAmount)}</p>
                  </div>
                  <p className="text-lg font-semibold">{totalUserBets} apostas</p>
                </div>
              )}

              {allOptions.length > 0 ? (
                <div className="grid gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                      {multi ? 'Escolha sua opção' : 'Probabilidades atuais'}
                    </h3>
                    {multi && allOptions.length > 6 && (
                      <Input
                        placeholder="Buscar seleção..."
                        value={optionSearch}
                        onChange={(e) => setOptionSearch(e.target.value)}
                        className="h-10 w-full sm:max-w-sm rounded-md"
                      />
                    )}
                  </div>
                  {multi && (
                    <p className="text-xs text-muted-foreground -mt-1">
                      Cada linha é uma seleção (time, continente, empate…). A % é a chance de essa opção vencer.
                    </p>
                  )}
                  <div className={`${multi && options.length > 4 ? 'max-h-[min(58vh,720px)] overflow-y-auto pr-1' : ''} space-y-3`}>
                    {options.map((opt) => {
                      const pct = Math.round(opt.probability * 100);
                      const potential = calcPotentialReturn(amountNum, opt.probability);
                      const profit = calcProfit(amountNum, opt.probability);

                      return (
                        <div key={`${opt.id}-${opt.label}`} className="border border-border/60 rounded-lg p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/20">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1">
                              <span className="font-medium text-base">{opt.label}</span>
                              <span className="font-bold text-2xl tabular-nums text-primary shrink-0">{pct}%</span>
                            </div>
                            {user && amountNum > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Retorno potencial: <span className="text-primary font-semibold">${potential.toFixed(2)}</span>
                                {' '}(lucro +${profit.toFixed(2)})
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[280px] shrink-0">
                            {user ? (
                              <>
                                <div className="flex gap-2">
                                  <div className="relative flex-1 min-w-[100px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                    <Input
                                      type="number"
                                      min="1"
                                      className="pl-7 h-11 rounded-md"
                                      value={betAmount}
                                      onChange={(e) => setBetAmount(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleBet(opt.label, opt.probability, opt.id)}
                                    disabled={isBetting}
                                    className="h-11 rounded-md px-6 shrink-0"
                                  >
                                    Apostar
                                  </Button>
                                </div>
                                <div className="flex gap-1.5">
                                  {[10, 50, 100].map((preset) => (
                                    <Button key={preset} variant="outline" size="sm" className="flex-1 rounded-sm text-xs h-7" onClick={() => setBetAmount(String(preset))}>
                                      ${preset}
                                    </Button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <Button disabled variant="outline" className="w-full h-10 rounded-md">Faça login para apostar</Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {multi && options.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma seleção encontrada.</p>
                  )}

                  {bets.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Apostas recentes</h3>
                      <div className="space-y-2">
                        {bets.map((bet) => (
                          <div key={bet.id} className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/40 text-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              {bet.photoURL ? (
                                <img src={bet.photoURL} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                  {bet.userName?.[0]}
                                </div>
                              )}
                              <span className="text-muted-foreground truncate">
                                <strong className="text-foreground">{bet.userName}</strong> → {bet.outcome}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-medium">${bet.amount} @ {(bet.price * 100).toFixed(0)}%</span>
                              {bet.potentialReturn && (
                                <p className="text-[10px] text-primary">retorno ${bet.potentialReturn.toFixed(2)}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground">
                                {bet.timestamp ? formatDistanceToNow(new Date(bet.timestamp), { addSuffix: true, locale: ptBR }) : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm border border-dashed rounded-md">
                  Dados indisponíveis no momento
                </div>
              )}
            </TabsContent>

            <TabsContent value="chart" className="mt-0 space-y-4">
              <div className="bg-muted/20 p-4 rounded-md border min-h-[320px] h-[min(42vh,420px)]">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                  Evolução — {allOptions[0]?.label ?? 'favorito'} {loadingHistory && '(carregando...)'}
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="yes" name={allOptions[0]?.label ?? 'Sim'} stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                    {!multi && <Line type="monotone" dataKey="no" name="Não" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-muted/20 p-4 rounded-md border min-h-[280px] h-[min(36vh,360px)]">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Volume estimado</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(0)}`, 'Volume']} />
                    <Line type="monotone" dataKey="vol" name="Volume" stroke="var(--color-primary)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center">Fonte: Polymarket · CLOB API</p>
            </TabsContent>

            <TabsContent value="book" className="mt-0">
              {orderBook ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-md border p-4">
                    <h4 className="text-xs uppercase text-muted-foreground mb-3">Compras (bids)</h4>
                    <div className="space-y-1 text-sm font-mono">
                      {orderBook.bids.slice(0, 8).map((b, i) => (
                        <div key={i} className="flex justify-between text-primary">
                          <span>{(parseFloat(b.price) * 100).toFixed(1)}%</span>
                          <span className="text-muted-foreground">${parseFloat(b.size).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border p-4">
                    <h4 className="text-xs uppercase text-muted-foreground mb-3">Vendas (asks)</h4>
                    <div className="space-y-1 text-sm font-mono">
                      {orderBook.asks.slice(0, 8).map((a, i) => (
                        <div key={i} className="flex justify-between text-pink-500">
                          <span>{(parseFloat(a.price) * 100).toFixed(1)}%</span>
                          <span className="text-muted-foreground">${parseFloat(a.size).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-md">
                  Order book indisponível para este mercado (comum em mercados UCDB simulados).
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
