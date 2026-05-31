import { HelpCircle } from 'lucide-react';

export function HelpTip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center group relative cursor-help ml-1">
      <HelpCircle size={13} className="text-muted-foreground/70" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-2 py-1.5 text-xs bg-popover border border-border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 text-popover-foreground">
        {text}
      </span>
    </span>
  );
}

export function SourceBadge({ source }: { source?: 'polymarket' | 'ucdb' }) {
  if (source === 'ucdb') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-medium">
        UCDB
      </span>
    );
  }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium">
      Polymarket
    </span>
  );
}
