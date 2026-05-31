import React from 'react';
import { User } from 'firebase/auth';
import { LogIn, Moon, LayoutGrid, User as UserIcon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { UserAvatar } from './UserAvatar';
import { AppLogo } from './AppLogo';
import { useTheme } from 'next-themes';
import { getUserDisplayName } from '../lib/user';

export type AppView = 'mercados' | 'favoritos' | 'perfil';

interface AppLayoutProps {
  children: React.ReactNode;
  user: User | null;
  view: AppView;
  onViewChange: (view: AppView) => void;
  onLogin: () => void;
  balance?: number | null;
}

export function AppLayout({
  children,
  user,
  view,
  onViewChange,
  onLogin,
  balance,
}: AppLayoutProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      <div className="fixed inset-0 pointer-events-none arena-bg" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="w-full px-4 lg:px-8 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => onViewChange('mercados')}
            className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
          >
            <AppLogo showText />
          </button>

          <nav className="hidden md:flex items-center gap-1 ml-auto border border-border/50 rounded-md p-0.5 bg-muted/30">
            <NavTab active={view === 'mercados'} onClick={() => onViewChange('mercados')} icon={<LayoutGrid size={15} />} label="Mercados" />
            <NavTab active={view === 'favoritos'} onClick={() => onViewChange('favoritos')} icon={<Star size={15} />} label="Favoritos" />
            <NavTab active={view === 'perfil'} onClick={() => onViewChange('perfil')} icon={<UserIcon size={15} />} label="Perfil" />
          </nav>

          <div className="flex items-center gap-3 ml-auto md:ml-0 md:pl-3 md:border-l md:border-border/40">
            {user && balance != null && (
              <span className="text-sm font-semibold tabular-nums text-primary hidden md:block">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(balance)}
              </span>
            )}
            <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} className="scale-90" />
            <Moon size={14} className="text-muted-foreground hidden sm:block" />

            {user ? (
              <button
                type="button"
                onClick={() => onViewChange('perfil')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <UserAvatar user={user} size="sm" />
                <span className="text-sm font-medium hidden lg:block max-w-[100px] truncate">
                  {getUserDisplayName(user)}
                </span>
              </button>
            ) : (
              <Button onClick={onLogin} size="sm" className="rounded-md gap-1.5">
                <LogIn size={15} />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="relative w-full px-4 lg:px-8 py-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-md">
        <div className="grid grid-cols-3">
          <BottomTab active={view === 'mercados'} onClick={() => onViewChange('mercados')} icon={<LayoutGrid size={20} />} label="Mercados" />
          <BottomTab active={view === 'favoritos'} onClick={() => onViewChange('favoritos')} icon={<Star size={20} />} label="Favoritos" />
          <BottomTab active={view === 'perfil'} onClick={() => onViewChange('perfil')} icon={<UserIcon size={20} />} label="Perfil" />
        </div>
      </nav>
    </div>
  );
}

function NavTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BottomTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
