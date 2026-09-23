import { cn } from '@/lib/utils';

type Tone = 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple';

const TONES: Record<Tone, string> = {
  gray:   'bg-[color:var(--gray-soft)] text-[color:var(--gray-fg)]',
  blue:   'bg-[color:var(--blue-soft)] text-[color:var(--blue-fg)]',
  green:  'bg-[color:var(--green-soft)] text-[color:var(--green-fg)]',
  red:    'bg-[color:var(--red-soft)] text-[color:var(--red-fg)]',
  orange: 'bg-[color:var(--orange-soft)] text-[color:var(--orange-fg)]',
  yellow: 'bg-[color:var(--yellow-soft)] text-[color:var(--yellow-fg)]',
  purple: 'bg-[color:var(--purple-soft)] text-[color:var(--purple-fg)]',
};

export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11px] font-medium leading-none tracking-tight',
      TONES[tone], className
    )}>{children}</span>
  );
}