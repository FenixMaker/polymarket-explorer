import type { User } from 'firebase/auth';

export function getUserPhotoURL(user: User | null | undefined): string | null {
  if (!user) return null;
  if (user.photoURL) return user.photoURL;
  const googlePhoto = user.providerData.find((p) => p.providerId === 'google.com')?.photoURL;
  return googlePhoto ?? user.providerData.find((p) => p.photoURL)?.photoURL ?? null;
}

export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return 'Visitante';
  return user.displayName || user.email?.split('@')[0] || 'Usuário';
}

export function getUserInitials(user: User | null | undefined): string {
  const name = getUserDisplayName(user);
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function formatMemberSince(user: User | null | undefined): string {
  if (!user?.metadata?.creationTime) return '—';
  return new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
