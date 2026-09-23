'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { keluarAction } from '@/features/auth/actions';
import { useState } from 'react';

const MENU = [
  { href: '/beranda', label: 'Beranda' },
  { href: '/kegiatan', label: 'Kegiatan' },
  { href: '/alur', label: 'Alur' },
  { href: '/persediaan', label: 'Persediaan' },
  { href: '/biaya', label: 'Biaya' },
  { href: '/aset', label: 'Aset' },
  { href: '/hse', label: 'HSE' },
  { href: '/analitik', label: 'Analitik' },
  { href: '/laporan', label: 'Laporan' },
  { href: '/data-induk', label: 'Data Induk' },
];

export default function TopNav({ ctx }: { ctx: { namaLengkap: string; organisasiNama: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="hidden md:block border-b border-[color:var(--border)] sticky top-0 bg-[color:var(--bg)]/95 backdrop-blur z-30">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/beranda" className="font-semibold tracking-tight">KANABA</Link>
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {MENU.map((m) => {
            const aktif = pathname.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${
                  aktif ? 'bg-[color:var(--bg-2)] font-medium' : 'text-[color:var(--text-2)] hover:bg-[color:var(--bg-2)]'
                }`}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <input placeholder="Cari…" className="rounded border border-[color:var(--border)] px-3 py-1.5 bg-transparent w-48" />
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-full border border-[color:var(--border)] w-8 h-8 flex items-center justify-center text-xs"
          >
            {ctx.namaLengkap.charAt(0).toUpperCase() || 'U'}
          </button>
          {open && (
            <div className="absolute right-4 top-14 rounded border border-[color:var(--border)] bg-[color:var(--bg)] p-3 w-56 shadow-sm">
              <div className="text-sm font-medium">{ctx.namaLengkap || 'Pengguna'}</div>
              <div className="text-xs text-[color:var(--text-2)] mb-2">{ctx.organisasiNama}</div>
              <form action={keluarAction}>
                <button className="text-sm text-red hover:underline">Keluar</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}