import { useEffect, useState } from 'react';
import { Star, LogIn } from 'lucide-react';
import { PolymarketEvent } from '../types';
import { getFavorites } from '../lib/favorites';
import { User } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SourceBadge } from './HelpTip';
import { EventDetails } from './EventDetails';

interface FavoritesPageProps {
  user: User | null;
  onLogin: () => void;
  onBetPlaced?: () => void;
}

export function FavoritesPage({ user, onLogin, onBetPlaced }: FavoritesPageProps) {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PolymarketEvent | null>(null);

  useEffect(() => {
    const favs = getFavorites();
    if (favs.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }
    Promise.all(
      favs.map((f) =>
        fetch(`/api/events/${f.id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((list) => {
      setEvents(list.filter(Boolean));
      setLoading(false);
    });
  }, []);

  if (!user) {
    return (
      <div className="text-center py-20">
        <Star size={40} className="mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold mb-2">Seus favoritos</h2>
        <p className="text-muted-foreground text-sm mb-6">Entre para salvar mercados e receber alertas de cotação.</p>
        <Button onClick={onLogin} className="rounded-md gap-2"><LogIn size={16} /> Entrar</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-md" />)}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Star size={36} className="mx-auto mb-3 opacity-30" />
        <p>Nenhum favorito ainda.</p>
        <p className="text-sm mt-1">Clique na estrela em um mercado para salvar.</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Meus favoritos ({events.length})</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
        {events.map((event) => (
          <Card key={event.id} className="rounded-md min-h-[120px] cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelected(event)}>
            <CardContent className="p-5">
              <div className="mb-2"><SourceBadge source={event.source} /></div>
              <p className="text-[15px] font-medium line-clamp-3">{event.title_pt || event.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <EventDetails event={selected} isOpen={!!selected} onClose={() => setSelected(null)} user={user} onBetPlaced={onBetPlaced} />
    </>
  );
}
