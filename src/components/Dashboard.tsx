import { useEffect, useState, useMemo, type FormEvent, type MouseEvent } from 'react';
import { Search, RefreshCcw, Flame, LogIn, GraduationCap, Star, Bell } from 'lucide-react';
import { PolymarketEvent } from '../types';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'firebase/auth';
import { EventDetails } from './EventDetails';
import { HelpTip, SourceBadge } from './HelpTip';
import {
  filterAndSortEvents,
  getMainPrice,
  MARKET_GLOSSARY,
  MarketKind,
  SortKey,
} from '../lib/market-utils';
import { getEventOptions, isMultiChoiceEvent } from '../lib/market-options';
import { isFavorite, toggleFavorite, updateStoredPrices } from '../lib/favorites';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Category = 'all' | 'copa' | 'ucdb';

interface DashboardProps {
  user: User | null;
  onLogin: () => void;
  onBetPlaced?: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function Dashboard({ user, onLogin, onBetPlaced }: DashboardProps) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PolymarketEvent | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<{ title: string; change: number }[]>([]);
  const [favTick, setFavTick] = useState(0);

  const [kindFilter, setKindFilter] = useState<MarketKind | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('volume');

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category,
        limit: '80',
        ...(searchQuery ? { q: searchQuery } : {}),
      });
      const response = await fetch(`/api/markets?${params}`);
      if (!response.ok) throw new Error('Falha ao buscar mercados');
      const data: PolymarketEvent[] = await response.json();
      setEvents(data);
      setLastFetchedAt(new Date());
      const alerts = updateStoredPrices(data);
      if (alerts.length > 0) {
        setPriceAlerts(alerts.map((a) => ({ title: a.title, change: a.change })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [searchQuery, category]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputValue);
  };

  const showCopaFilters = category === 'copa' || category === 'all';

  const displayedEvents = useMemo(() => {
    if (category === 'ucdb') return events;
    if (category === 'copa') {
      return filterAndSortEvents(events, {
        kind: kindFilter,
        group: groupFilter,
        team: teamFilter,
        sort: sortKey,
      });
    }
    const ucdb = events.filter((e) => e.source === 'ucdb');
    const copa = events.filter((e) => e.source !== 'ucdb');
    const filteredCopa = filterAndSortEvents(copa, {
      kind: kindFilter,
      group: groupFilter,
      team: teamFilter,
      sort: sortKey,
    });
    return [...ucdb, ...filteredCopa];
  }, [events, category, kindFilter, groupFilter, teamFilter, sortKey]);

  const categoryLabel =
    category === 'copa' ? 'Copa do Mundo 2026' : category === 'ucdb' ? 'UCDB' : 'Todos os mercados';

  return (
    <>
      <section className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-widest mb-1">Mercados de predição</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight">Cotações ao vivo</h1>
          {lastFetchedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado {formatDistanceToNow(lastFetchedAt, { addSuffix: true, locale: ptBR })}
            </p>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full lg:w-auto lg:min-w-[420px]">
          <div className="relative flex-1">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Buscar mercados..."
              className="pl-10 h-10 rounded-md bg-muted/30 border-border/60"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="submit" className="rounded-md px-5 h-10">Buscar</Button>
        </form>
      </section>

      {priceAlerts.length > 0 && (
        <div className="mb-4 p-3 rounded-md border border-border bg-muted/30 flex items-start gap-2">
          <Bell size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-medium text-foreground mb-1">Alertas de cotação nos favoritos</p>
            {priceAlerts.slice(0, 3).map((a, i) => (
              <p key={i} className="text-muted-foreground text-xs">{a.title} — variação de {a.change.toFixed(1)}%</p>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="rounded-md shrink-0" onClick={() => setPriceAlerts([])}>Ok</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['all', 'Todos'],
          ['copa', 'Copa 2026'],
          ['ucdb', 'UCDB'],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            variant={category === key ? 'default' : 'outline'}
            size="sm"
            className="rounded-md"
            onClick={() => setCategory(key)}
          >
            {key === 'ucdb' && <GraduationCap size={14} className="mr-1.5" />}
            {label}
          </Button>
        ))}
      </div>

      {showCopaFilters && category !== 'ucdb' && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-md border border-border/50 bg-muted/20">
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as MarketKind | 'all')}
            className="h-9 px-2 text-sm rounded-md border border-border bg-background"
          >
            <option value="all">Todos os tipos</option>
            <option value="campeao">Campeão</option>
            <option value="grupo">Grupos</option>
            <option value="jogo">Jogos</option>
            <option value="outro">Outros</option>
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="h-9 px-2 text-sm rounded-md border border-border bg-background"
          >
            <option value="all">Todos os grupos</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>Grupo {g}</option>
            ))}
          </select>
          <Input
            placeholder="Filtrar seleção..."
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-9 w-40 rounded-md"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 px-2 text-sm rounded-md border border-border bg-background"
          >
            <option value="volume">Ordenar: volume</option>
            <option value="liquidez">Ordenar: liquidez</option>
            <option value="probabilidade">Ordenar: probabilidade</option>
          </select>
        </div>
      )}

      {!user && (
        <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-md border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">Entre para apostar com saldo inicial de US$ 1.000.</p>
          <Button onClick={onLogin} size="sm" variant="outline" className="rounded-md gap-2 shrink-0">
            <LogIn size={16} /> Entrar
          </Button>
        </div>
      )}

      {!loading && !error && displayedEvents.length > 0 && category !== 'ucdb' && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-primary" size={20} />
            <h2 className="text-lg font-semibold">Em alta</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
            {[...displayedEvents]
              .filter((e) => e.source !== 'ucdb')
              .sort((a, b) => (b.volume || 0) - (a.volume || 0))
              .slice(0, 4)
              .map((event, i) => (
                <div key={event.id} className="h-full">
                  <TrendingCard event={event} index={i} onClick={() => setSelectedEvent(event)} />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">{categoryLabel}</h2>
          <p className="text-sm text-muted-foreground">{displayedEvents.length} mercados</p>
        </div>
        <Button onClick={fetchMarkets} disabled={loading} variant="outline" size="icon" className="rounded-md">
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-[240px] w-full rounded-lg" />
          ))}
        </div>
      ) : displayedEvents.length === 0 && !error ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>Nenhum mercado encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {displayedEvents.map((event, i) => (
            <div key={event.id} className="h-full">
              <EventCard
                event={event}
                index={i}
                favTick={favTick}
                onToggleFavorite={() => setFavTick((t) => t + 1)}
                onClick={() => setSelectedEvent(event)}
              />
            </div>
          ))}
        </div>
      )}

      <EventDetails
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        user={user}
        onBetPlaced={onBetPlaced}
        onFavoriteChange={() => setFavTick((t) => t + 1)}
      />
    </>
  );
}

function TrendingCard({ event, index, onClick }: { event: PolymarketEvent; index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer h-full"
    >
      <Card className="h-full rounded-lg border-border/50 bg-card shadow-sm hover:shadow-md hover:border-border transition-all">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] rounded-sm">Em alta</Badge>
            <SourceBadge source={event.source} />
          </div>
          <h3 className="font-medium text-sm line-clamp-2 mb-3">{event.title_pt || event.title}</h3>
          <p className="text-sm text-muted-foreground">
            Volume <HelpTip text={MARKET_GLOSSARY.volume} />
            <span className="text-primary font-semibold ml-1">{fmt(event.volume || 0)}</span>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventCard({
  event,
  index,
  favTick,
  onToggleFavorite,
  onClick,
}: {
  event: PolymarketEvent;
  index: number;
  favTick: number;
  onToggleFavorite: () => void;
  onClick: () => void;
}) {
  void favTick;
  const multi = isMultiChoiceEvent(event);
  const allOptions = getEventOptions(event);
  const preview = multi ? allOptions.slice(0, 4) : allOptions.slice(0, 2);
  const extraCount = multi ? Math.max(0, allOptions.length - preview.length) : 0;

  const mainPrice = getMainPrice(event);
  const favorited = isFavorite(event.id);

  const handleStar = (e: MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(event, mainPrice);
    onToggleFavorite();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      className="cursor-pointer h-full"
    >
      <Card className="h-full flex flex-col rounded-lg border-border/50 bg-card shadow-sm hover:shadow-md hover:border-border transition-all duration-200">
        <CardHeader className="pb-3 px-4 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            {event.image ? (
              <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                <img src={event.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-md bg-muted shrink-0 flex items-center justify-center text-base">
                {event.source === 'ucdb' ? '🎓' : '⚽'}
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <SourceBadge source={event.source} />
              {event.active && (
                <span className="text-[10px] text-muted-foreground">· Ativo</span>
              )}
            </div>
            <button type="button" onClick={handleStar} className="p-1 shrink-0 hover:opacity-70 transition-opacity">
              <Star size={15} className={favorited ? 'fill-primary text-primary' : 'text-muted-foreground/50'} />
            </button>
          </div>
          <CardTitle className="text-[15px] leading-snug line-clamp-2 font-medium">
            {event.title_pt || event.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 pb-4 px-4 flex flex-col justify-end gap-3">
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span>Vol. {fmt(event.volume || 0)}</span>
            <span>Liq. {fmt(event.liquidity || 0)}</span>
          </div>

          {preview.length >= 1 ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {preview.map((opt, idx) => {
                  const pct = Math.round(opt.probability * 100);
                  return (
                    <div
                      key={`${opt.id}-${opt.label}`}
                      className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-md bg-muted/60"
                    >
                      <span className="text-xs font-medium truncate text-foreground/85">{opt.label}</span>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
              {extraCount > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  +{extraCount} seleções
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sem cotação</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
