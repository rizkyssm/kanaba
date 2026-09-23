'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileMenu from './ProfileMenu';
import { SearchInput } from '@/components/ui/SearchInput';
import { Bell } from 'lucide-react';
import { useState } from 'react';

const MENU = [
  { href: '/beranda',      label: 'Beranda' },
  { href: '/kegiatan',     label: 'Kegiatan' },
  { href: '/alur',         label: 'Alur' },
  { href: '/persediaan',   label: 'Persediaan' },
  { href: '/liquid-oxygen',label: 'LOX' },
  { href: '/hse',          label: 'HSE' },
  { href: '/aset',         label: 'Aset' },
  { href: '/biaya',        label: 'Biaya' },
  { href: '/analitik',     label: 'Analitik' },
  { href: '/laporan',      label: 'Laporan' },
  { href: '/data-induk',   label: 'Data Induk' },
];

export default function TopNav({
  ctx,
}: { ctx: { namaLengkap: string; email: string; organisasiNama: string } }) {
  const pathname = usePathname();
  const [q, setQ] = useState('');

  return (
    <header className="hidden md:block sticky top-0 z-30 border-b bg-[color:var(--bg)]/85 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center gap-6">
        <Link href="/beranda" className="font-semibold text-[15px] tracking-tight shrink-0">
          KANABA
        </Link>

        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {MENU.map((m) => {
            const aktif = pathname === m.href || pathname.startsWith(m.href + '/');
            return (
              <Link
                key={m.href}
                href={m.href}
                className={
                  'px-3 h-8 rounded-full text-[13px] font-medium whitespace-nowrap flex items-center ' +
                  (aktif
                    ? 'bg-[color:var(--bg-subtle)] text-[color:var(--text)]'
                    : 'text-[color:var(--text-2)] hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text)]')
                }
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <SearchInput value={q} onChange={setQ} placeholder="Cari…" className="w-56" />
          <button className="w-9 h-9 rounded-full hover:bg-[color:var(--bg-hover)] flex items-center justify-center focus-ring">
            <Bell size={16} className="text-[color:var(--text-2)]" />
          </button>
          <ProfileMenu
            nama={ctx.namaLengkap}
            email={ctx.email}
            organisasiNama={ctx.organisasiNama}
          />
        </div>
      </div>
    </header>
  );
}