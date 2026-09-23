'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, GitBranch, Package, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const MENU = [
  { href: '/beranda',    label: 'Beranda',    icon: Home },
  { href: '/kegiatan',   label: 'Kegiatan',   icon: ListChecks },
  { href: '/alur',       label: 'Alur',       icon: GitBranch },
  { href: '/persediaan', label: 'Persediaan', icon: Package },
];

const LAINNYA = [
  { href: '/liquid-oxygen', label: 'Liquid Oxygen' },
  { href: '/biaya',         label: 'Biaya' },
  { href: '/aset',          label: 'Aset' },
  { href: '/hse',           label: 'HSE' },
  { href: '/analitik',      label: 'Analitik' },
  { href: '/laporan',       label: 'Laporan' },
  { href: '/data-induk',    label: 'Data Induk' },
  { href: '/pengaturan',    label: 'Pengaturan' },
  { href: '/admin/pengguna',label: 'Pengguna' },
  { href: '/admin/log',     label: 'Log Aktivitas' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute bottom-[68px] left-0 right-0 bg-[color:var(--bg-elev)] border-t rounded-t-[var(--radius-xl)] p-3 pb-5"
            onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[color:var(--border)] rounded-full mx-auto mb-3" />
            <div className="grid grid-cols-2 gap-2">
              {LAINNYA.map((m) => (
                <Link key={m.href} href={m.href} onClick={() => setOpen(false)}
                  className="text-[13px] py-2.5 px-3 rounded-[var(--radius-md)] bg-[color:var(--bg-subtle)] hover:bg-[color:var(--bg-hover)] text-center">
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t bg-[color:var(--bg-elev)]/95 backdrop-blur-xl">
        <div className="grid grid-cols-5 h-[60px] pb-[env(safe-area-inset-bottom)]">
          {MENU.map((m) => {
            const Icon = m.icon;
            const aktif = pathname === m.href || pathname.startsWith(m.href + '/');
            return (
              <Link key={m.href} href={m.href}
                className={cn('flex flex-col items-center justify-center gap-1 text-[10px]',
                  aktif ? 'text-blue' : 'text-[color:var(--text-3)]')}>
                <Icon size={20} strokeWidth={aktif ? 2.4 : 2} />
                <span className="font-medium">{m.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen((o) => !o)}
            className="flex flex-col items-center justify-center gap-1 text-[10px] text-[color:var(--text-3)]">
            <MoreHorizontal size={20} />
            <span className="font-medium">Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
}