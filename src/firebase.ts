import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA0FKCiI_NEqGYD4Fu-f-RzMGxq_AJd--Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'login-polymarkt.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'login-polymarkt',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'login-polymarkt.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '887259676743',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:887259676743:web:2394c2e4eda97ac9207162',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-GPVK7DFLG5',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

setPersistence(auth, browserLocalPersistence).catch(console.error);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('profile');
googleProvider.addScope('email');

export const resolveGoogleRedirect = () => getRedirectResult(auth);

export const loginWithGoogle = async () => {
  const useRedirect =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

export const logout = () => signOut(auth);
