import { cn } from '@/lib/utils';

export function StatRow({
  label, value, tone = 'neutral', className,
}: { label: React.ReactNode; value: React.ReactNode; tone?: 'neutral' | 'green' | 'red' | 'orange' | 'blue' | 'muted'; className?: string }) {
  const toneCls =
    tone === 'green' ? 'text-[color:var(--green-fg)]' :
    tone === 'red' ? 'text-[color:var(--red-fg)]' :
    tone === 'orange' ? 'text-[color:var(--orange-fg)]' :
    tone === 'blue' ? 'text-[color:var(--blue-fg)]' :
    tone === 'muted' ? 'text-[color:var(--text-2)]' :
    'text-[color:var(--text)]';
  return (
    <div className={cn('flex items-baseline justify-between py-1.5 gap-3 text-[13px]', className)}>
      <span className="text-[color:var(--text-2)] truncate">{label}</span>
      <span className={cn('font-medium tnum whitespace-nowrap', toneCls)}>{value}</span>
    </div>
  );
}