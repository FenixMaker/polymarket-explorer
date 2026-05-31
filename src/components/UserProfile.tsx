import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { UserBet, UserWallet } from '../types';
import { UserAvatar } from './UserAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Mail, Calendar, TrendingUp, Wallet, PiggyBank, BarChart3, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUserDisplayName, formatMemberSince } from '../lib/user';
import { getLeaderboard, getUserBets } from '../services/firestore-db';

interface UserProfileProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  wallet: UserWallet | null;
  onWalletUpdate: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(n);

type LeaderEntry = {
  rank: number;
  name: string;
  email: string;
  balance: number;
  photoURL?: string;
};

export function UserProfile({ user, onLogin, onLogout, wallet, onWalletUpdate }: UserProfileProps) {
  const [bets, setBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    if (!user?.uid && !user?.email) {
      setBets([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const loadBets = async () => {
      if (user?.uid) {
        setBets(await getUserBets(user.uid));
      }
    };

    loadBets()
      .catch(console.error)
      .finally(() => setLoading(false));

    getLeaderboard(10)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));

    onWalletUpdate();
  }, [user, onWalletUpdate]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Entre na sua conta</h2>
        <p className="text-muted-foreground mb-6 text-sm">Saldo inicial de US$ 1.000 para apostas simuladas.</p>
        <Button onClick={onLogin} className="rounded-md gap-2">
          <LogIn size={18} /> Entrar com Google
        </Button>
      </div>
    );
  }

  const displayName = getUserDisplayName(user);
  const balance = wallet?.balance ?? 1000;
  const spent = wallet?.spent ?? 0;
  const initial = wallet?.initial ?? 1000;
  const myRank = leaderboard.find((e) => e.email === user.email)?.rank;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1 space-y-4">
        <Card className="rounded-md border-border/60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <UserAvatar user={user} size="lg" />
              <div className="min-w-0">
                <h2 className="text-xl font-semibold truncate">{displayName}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                  <Mail size={13} /> {user.email}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Calendar size={13} /> Membro desde {formatMemberSince(user)}
                </p>
                {myRank && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-2">
                    <Trophy size={13} /> #{myRank} no ranking
                  </p>
                )}
              </div>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm" className="rounded-md gap-2 w-full">
              <LogOut size={16} /> Sair da conta
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border/50 bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet size={16} className="text-primary" /> Saldo disponível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums text-primary">{fmt(balance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Saldo inicial: {fmt(initial)}</p>
          </CardContent>
        </Card>

        {leaderboard.length > 0 && (
          <Card className="rounded-md border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy size={16} className="text-primary" /> Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.email}
                  className={`flex items-center justify-between text-sm py-1.5 ${
                    entry.email === user.email ? 'text-primary font-medium' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground w-5">#{entry.rank}</span>
                    {entry.photoURL ? (
                      <img src={entry.photoURL} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover" />
                    ) : null}
                    <span className="truncate">{entry.name}</span>
                  </span>
                  <span className="tabular-nums shrink-0">{fmt(entry.balance)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="xl:col-span-2 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<PiggyBank size={16} />} label="Saldo inicial" value={fmt(initial)} />
          <StatCard icon={<TrendingUp size={16} />} label="Apostas feitas" value={String(bets.length)} />
          <StatCard icon={<BarChart3 size={16} />} label="Total apostado" value={fmt(spent)} />
          <StatCard icon={<Wallet size={16} />} label="Disponível" value={fmt(balance)} highlight />
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Histórico de apostas</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : bets.length === 0 ? (
            <Card className="rounded-md border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma aposta ainda. Explore mercados da Copa ou UCDB e faça sua primeira aposta simulada.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {bets.map((bet) => (
                <Card key={bet.id} className="rounded-md border-border/50">
                  <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {bet.eventTitle || 'Mercado'} — <span className="text-primary">{bet.outcome}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bet.timestamp
                          ? formatDistanceToNow(new Date(bet.timestamp), { addSuffix: true, locale: ptBR })
                          : ''}
                        {bet.potentialReturn ? ` · retorno pot. ${fmt(bet.potentialReturn)}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm tabular-nums">{fmt(bet.amount)}</p>
                      <Badge variant="secondary" className="text-[10px] rounded-sm mt-0.5">
                        {bet.status || 'ativa'} · {(bet.price * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={`rounded-lg ${highlight ? 'border-border bg-muted/30' : 'border-border/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">{icon} {label}</div>
        <p className={`text-lg font-bold tabular-nums ${highlight ? 'text-primary' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
