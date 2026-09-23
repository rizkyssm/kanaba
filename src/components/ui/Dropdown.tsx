'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function Dropdown({
  trigger, children, align = 'right', className,
}: { trigger: React.ReactNode; children: (close: () => void) => React.ReactNode; align?: 'left' | 'right'; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={cn(
          'absolute z-50 mt-2 min-w-[220px] rounded-[var(--radius-lg)] border bg-[color:var(--bg-elev)] shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5',
          align === 'right' ? 'right-0' : 'left-0',
          className
        )}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children, onClick, danger, className,
}: { children: React.ReactNode; onClick?: () => void; danger?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 text-[13px] hover:bg-[color:var(--bg-hover)] flex items-center gap-2',
        danger ? 'text-red' : 'text-[color:var(--text)]',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[color:var(--border)]" />;
}