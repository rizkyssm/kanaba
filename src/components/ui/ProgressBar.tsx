import { cn } from '@/lib/utils';

export function ProgressBar({
  value, max = 100, tone = 'blue', className,
}: { value: number; max?: number; tone?: 'blue' | 'green' | 'orange' | 'red'; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  const bg =
    tone === 'green' ? 'bg-green' :
    tone === 'orange' ? 'bg-orange' :
    tone === 'red' ? 'bg-red' : 'bg-blue';
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-[color:var(--bg-subtle)] overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all', bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}