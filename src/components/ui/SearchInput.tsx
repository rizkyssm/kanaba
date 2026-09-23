'use client';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({
  value, onChange, placeholder = 'Cari…', className,
}: { value?: string; onChange?: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-3)]" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-8 pr-3 text-[13px] bg-[color:var(--bg-subtle)] rounded-full border border-transparent focus-ring focus:bg-[color:var(--bg)] focus:border-[color:var(--border)]"
      />
    </div>
  );
}