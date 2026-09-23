import { cn } from '@/lib/utils';

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[var(--radius-lg)] border overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          {children}
        </table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-[color:var(--bg-inset)]">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({ children, align = 'left', className }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <th className={cn(
      'px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)]',
      'border-b border-[color:var(--border)] whitespace-nowrap',
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      className
    )}>{children}</th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr className={cn('group hover:bg-[color:var(--bg-hover)]/60 cursor-default', className)} onClick={onClick}>
      {children}
    </tr>
  );
}

export function TD({ children, align = 'left', className }: { children?: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <td className={cn(
      'px-4 py-3 align-middle border-b border-[color:var(--border-soft)]',
      'text-[13px] leading-snug',
      align === 'right' ? 'text-right tnum' : align === 'center' ? 'text-center' : 'text-left',
      className
    )}>{children}</td>
  );
}