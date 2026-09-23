import Link from 'next/link';

const ITEM = [
  { href: '/data-induk/site', label: 'Site' },
  { href: '/data-induk/material', label: 'Material' },
  { href: '/data-induk/satuan', label: 'Satuan' },
  { href: '/data-induk/kategori-material', label: 'Kategori Material' },
];

export default function DataIndukPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Data Induk</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ITEM.map((i) => (
          <Link key={i.href} href={i.href} className="rounded border border-[color:var(--border)] p-4 hover:bg-[color:var(--bg-2)]">
            {i.label}
          </Link>
        ))}
      </div>
    </div>
  );
}