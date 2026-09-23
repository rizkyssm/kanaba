import { cn } from '@/lib/utils';

export function KPICard({
  label, value, sub, tone = 'neutral', className,
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'neutral' | 'green' | 'red' | 'orange' | 'blue' | 'purple'; className?: string }) {
  const toneCls =
    tone === 'green' ? 'text-[color:var(--green-fg)]' :
    tone === 'red' ? 'text-[color:var(--red-fg)]' :
    tone === 'orange' ? 'text-[color:var(--orange-fg)]' :
    tone === 'blue' ? 'text-[color:var(--blue-fg)]' :
    tone === 'purple' ? 'text-[color:var(--purple-fg)]' :
    'text-[color:var(--text)]';

  return (
    <div className={cn('rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)] px-4 py-3.5', className)}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)]">{label}</div>
      <div className={cn('mt-1.5 text-[20px] font-semibold tnum', toneCls)}>{value}</div>
      {sub && <div className="text-[12px] text-[color:var(--text-2)] mt-0.5">{sub}</div>}
    </div>
  );
}