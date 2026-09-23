'use client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type TabItem = { key: string; label: string; count?: number; href?: string };

export function Tabs({
  items, active, onSelect, variant = 'pill',
}: {
  items: TabItem[];
  active: string;
  onSelect?: (key: string) => void;
  variant?: 'pill' | 'underline';
}) {
  return (
    <div className="relative -mx-1 overflow-x-auto">
      <div className={cn('flex items-center gap-1 px-1 min-w-max',
        variant === 'pill' ? '' : 'border-b'
      )}>
        {items.map((it) => {
          const isActive = it.key === active;
          const inner = (
            <>
              <span>{it.label}</span>
              {typeof it.count === 'number' && (
                <span className={cn(
                  'ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] tabular-nums',
                  isActive
                    ? 'bg-blue text-white'
                    : 'bg-[color:var(--bg-subtle)] text-[color:var(--text-2)]'
                )}>{it.count}</span>
              )}
            </>
          );
          const baseCls = variant === 'pill'
            ? cn(
                'inline-flex items-center h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap',
                isActive
                  ? 'bg-[color:var(--bg-subtle)] text-[color:var(--text)]'
                  : 'text-[color:var(--text-2)] hover:bg-[color:var(--bg-hover)]'
              )
            : cn(
                'inline-flex items-center h-10 px-3 text-sm whitespace-nowrap -mb-px border-b-2',
                isActive
                  ? 'border-blue text-blue font-medium'
                  : 'border-transparent text-[color:var(--text-2)] hover:text-[color:var(--text)]'
              );

          if (it.href) {
            return <Link key={it.key} href={it.href} className={baseCls}>{inner}</Link>;
          }
          return (
            <button key={it.key} onClick={() => onSelect?.(it.key)} className={baseCls}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}