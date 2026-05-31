import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout, resolveGoogleRedirect } from './firebase';
import { AppLayout, AppView } from './components/AppLayout';
import Dashboard from './components/Dashboard';
import { UserProfile } from './components/UserProfile';
import { FavoritesPage } from './components/FavoritesPage';
import { OnboardingTour } from './components/OnboardingTour';
import { UserWallet } from './types';
import { ensureUser, subscribeWallet, getWallet } from './services/firestore-db';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('mercados');
  const [authReady, setAuthReady] = useState(false);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  useEffect(() => {
    resolveGoogleRedirect().catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      setFirebaseError(null);
      if (currentUser?.uid && currentUser.email) {
        try {
          await ensureUser(
            currentUser.uid,
            currentUser.email,
            currentUser.displayName || 'Usuário',
            currentUser.photoURL || undefined,
          );
          const w = await getWallet(currentUser.uid);
          if (w) setWallet(w);
        } catch (err) {
          console.error('Erro ao carregar perfil Firebase:', err);
          setFirebaseError('Não foi possível conectar ao Firebase. Verifique as regras do Firestore.');
        }
      } else {
        setWallet(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeWallet(user.uid, (w) => {
      if (w) setWallet(w);
    });
    return () => unsub();
  }, [user?.uid]);

  const refreshWallet = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const w = await getWallet(user.uid);
      if (w) setWallet(w);
    } catch (err) {
      console.error(err);
    }
  }, [user?.uid]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/popup-closed-by-user') return;
    }
  };

  const handleLogout = async () => {
    await logout();
    setWallet(null);
    setView('mercados');
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <OnboardingTour />
      {firebaseError && (
        <div className="relative z-30 mx-4 lg:mx-8 mt-3 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-sm text-destructive">
          {firebaseError}
        </div>
      )}
      <AppLayout
        user={user}
        view={view}
        onViewChange={setView}
        onLogin={handleLogin}
        balance={wallet?.balance ?? null}
      >
        {view === 'mercados' && (
          <Dashboard user={user} onLogin={handleLogin} onBetPlaced={refreshWallet} />
        )}
        {view === 'favoritos' && (
          <FavoritesPage user={user} onLogin={handleLogin} onBetPlaced={refreshWallet} />
        )}
        {view === 'perfil' && (
          <UserProfile
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            wallet={wallet}
            onWalletUpdate={refreshWallet}
          />
        )}
      </AppLayout>
    </>
  );
}
