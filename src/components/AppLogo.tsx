import { cn } from '@/lib/utils';

const LOGO_SRC = '/logopoly.png';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-14 h-14',
};

export function AppLogo({ size = 'md', showText = false, className }: AppLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5 shrink-0', className)}>
      <img
        src={LOGO_SRC}
        alt="Arena Polymarket"
        className={cn('object-contain rounded-md', sizes[size])}
        width={size === 'lg' ? 56 : size === 'md' ? 36 : 32}
        height={size === 'lg' ? 56 : size === 'md' ? 36 : 32}
      />
      {showText && (
        <div className="text-left hidden sm:block">
          <p className="font-heading font-semibold text-[15px] leading-tight">Arena Polymarket</p>
          <p className="text-[10px] text-muted-foreground">Copa 2026 · UCDB</p>
        </div>
      )}
    </div>
  );
}

export { LOGO_SRC };
