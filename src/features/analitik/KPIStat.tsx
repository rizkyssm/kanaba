import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function KPIStat({
  label,
  value,
  delta,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  delta?: { pct: number; label?: string };
  sub?: string;
  tone?: 'default' | 'orange' | 'green' | 'red' | 'blue' | 'purple';
}) {
  const toneCls =
    tone === 'green' ? 'text-[color:var(--green-fg)]'
    : tone === 'red' ? 'text-[color:var(--red-fg)]'
    : tone === 'orange' ? 'text-[color:var(--orange-fg)]'
    : tone === 'blue' ? 'text-[color:var(--blue-fg)]'
    : tone === 'purple' ? 'text-[color:var(--purple-fg)]'
    : 'text-[color:var(--text)]';

  const deltaNaik = delta ? delta.pct >= 0 : true;

  return (
    <div className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)] px-4 py-3.5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)]">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div className={cn('text-[20px] font-semibold tnum leading-tight', toneCls)}>
          {value}
        </div>
        {delta && (
          <span className={cn(
            'text-[12px] font-medium tnum inline-flex items-center gap-0.5',
            deltaNaik ? 'text-[color:var(--green-fg)]' : 'text-[color:var(--red-fg)]'
          )}>
            {deltaNaik ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {deltaNaik ? '+' : ''}{delta.pct.toFixed(1)}%
          </span>
        )}
      </div>
      {delta && (
        <div className="text-[11px] text-[color:var(--text-3)] mt-0.5">
          {delta.label ?? 'vs periode sebelumnya'}
        </div>
      )}
      {sub && !delta && (
        <div className="text-[11px] text-[color:var(--text-3)] mt-0.5">{sub}</div>
      )}
    </div>
  );
}