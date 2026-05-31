import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  increment,
  onSnapshot,
} from 'firebase/firestore';
import { app } from '../firebase';
import { UserBet, UserWallet } from '../types';

export const db = getFirestore(app);
const STARTING_BALANCE = 1000;

export function isFirestoreUnavailable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code ?? '';
  return (
    /offline|unavailable|permission-denied|failed-precondition|client is offline/i.test(msg) ||
    code === 'unavailable' ||
    code === 'permission-denied'
  );
}

export async function ensureUser(uid: string, email: string, name: string, photoURL?: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      name,
      photoURL: photoURL || null,
      balance: STARTING_BALANCE,
      initial: STARTING_BALANCE,
      spent: 0,
      totalBets: 0,
      createdAt: new Date().toISOString(),
    });
  } else {
    await updateDoc(ref, {
      email,
      name,
      photoURL: photoURL || null,
    });
  }
  return ref;
}

export async function getWallet(uid: string): Promise<UserWallet | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    balance: d.balance ?? STARTING_BALANCE,
    initial: d.initial ?? STARTING_BALANCE,
    spent: d.spent ?? 0,
    totalBets: d.totalBets ?? 0,
  };
}

export function subscribeWallet(
  uid: string,
  cb: (w: UserWallet | null) => void,
  onError?: (err: unknown) => void,
) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      const d = snap.data();
      cb({
        balance: d.balance ?? STARTING_BALANCE,
        initial: d.initial ?? STARTING_BALANCE,
        spent: d.spent ?? 0,
        totalBets: d.totalBets ?? 0,
      });
    },
    (err) => {
      console.warn('Firestore wallet:', err);
      onError?.(err);
    },
  );
}

export async function placeBet(
  uid: string,
  bet: Omit<UserBet, 'id' | 'timestamp'> & { potentialReturn: number },
): Promise<UserBet> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Usuário não encontrado. Faça login novamente.');
  const balance = userSnap.data().balance ?? 0;
  if (bet.amount > balance) throw new Error('Saldo insuficiente');

  const betDoc = {
    ...bet,
    userId: uid,
    timestamp: new Date().toISOString(),
    status: 'ativa' as const,
  };
  const ref = await addDoc(collection(db, 'users', uid, 'bets'), betDoc);
  const saved = { ...betDoc, id: ref.id } as UserBet;

  await updateDoc(userRef, {
    balance: balance - bet.amount,
    spent: increment(bet.amount),
    totalBets: increment(1),
  });

  await setDoc(doc(db, 'events', bet.eventId, 'bets', ref.id), saved);

  return saved;
}

export async function getUserBets(uid: string): Promise<UserBet[]> {
  const q = query(collection(db, 'users', uid, 'bets'), orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserBet));
}

export async function getEventBets(eventId: string, max = 30): Promise<UserBet[]> {
  const q = query(
    collection(db, 'events', eventId, 'bets'),
    orderBy('timestamp', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserBet));
}

export async function getLeaderboard(top = 10) {
  const q = query(collection(db, 'users'), orderBy('balance', 'desc'), limit(top));
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    rank: i + 1,
    name: d.data().name || 'Usuário',
    email: d.data().email,
    balance: d.data().balance ?? 0,
    photoURL: d.data().photoURL,
  }));
}

export async function voteUcdb(eventId: string, uid: string, vote: 'sim' | 'nao') {
  const ref = doc(db, 'ucdb_votes', eventId);
  const snap = await getDoc(ref);
  const votes = snap.exists() ? { ...snap.data().votes } : {};
  votes[uid] = vote;
  const counts = { sim: 0, nao: 0 };
  Object.values(votes).forEach((v) => counts[v as 'sim' | 'nao']++);
  await setDoc(ref, { votes, counts, updatedAt: new Date().toISOString() });
  return counts;
}

export async function getUcdbVotes(eventId: string) {
  const snap = await getDoc(doc(db, 'ucdb_votes', eventId));
  if (!snap.exists()) return { sim: 0, nao: 0, total: 0 };
  const c = snap.data().counts || { sim: 0, nao: 0 };
  return { ...c, total: (c.sim || 0) + (c.nao || 0) };
}
