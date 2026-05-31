import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { getUserDisplayName, getUserInitials, getUserPhotoURL } from '../lib/user';

type UserAvatarProps = {
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
};

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function UserAvatar({ user, size = 'md', className = '', ring = false }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const photo = getUserPhotoURL(user);
  const initials = getUserInitials(user);
  const name = getUserDisplayName(user);
  const ringClass = ring ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background' : '';
  const sizeClass = sizes[size];

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={`Foto de ${name}`}
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover shrink-0 bg-muted ${ringClass} ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full shrink-0 flex items-center justify-center font-semibold bg-muted text-primary ${ringClass} ${className}`}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
