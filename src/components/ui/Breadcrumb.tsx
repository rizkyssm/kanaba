import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px] text-[color:var(--text-2)]">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.href ? <Link href={it.href} className="hover:text-[color:var(--text)]">{it.label}</Link>
                   : <span>{it.label}</span>}
          {i < items.length - 1 && <ChevronRight size={12} className="text-[color:var(--text-3)]" />}
        </span>
      ))}
    </nav>
  );
}