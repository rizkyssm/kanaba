'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, GitBranch, Package, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

const MENU = [
  { href: '/beranda', label: 'Beranda', icon: Home },
  { href: '/kegiatan', label: 'Kegiatan', icon: ListChecks },
  { href: '/alur', label: 'Alur', icon: GitBranch },
  { href: '/persediaan', label: 'Persediaan', icon: Package },
];

const LAINNYA = [
  { href: '/biaya', label: 'Biaya' },
  { href: '/aset', label: 'Aset' },
  { href: '/hse', label: 'HSE' },
  { href: '/analitik', label: 'Analitik' },
  { href: '/laporan', label: 'Laporan' },
  { href: '/data-induk', label: 'Data Induk' },
  { href: '/pengaturan', label: 'Pengaturan' },
  { href: '/admin/pengguna', label: 'Pengguna' },
  { href: '/admin/log', label: 'Log Aktivitas' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 bg-[color:var(--bg)] border-t border-[color:var(--border)] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {LAINNYA.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className="text-sm py-2 px-3 rounded border border-[color:var(--border)] text-center"
                >
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[color:var(--border)] bg-[color:var(--bg)]/95 backdrop-blur z-30">
        <div className="grid grid-cols-5">
          {MENU.map((m) => {
            const Icon = m.icon;
            const aktif = pathname.startsWith(m.href);
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`flex flex-col items-center py-2 text-[11px] ${
                  aktif ? 'text-blue' : 'text-[color:var(--text-2)]'
                }`}
              >
                <Icon size={18} />
                {m.label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex flex-col items-center py-2 text-[11px] text-[color:var(--text-2)]"
          >
            <MoreHorizontal size={18} />
            Lainnya
          </button>
        </div>
      </nav>
    </>
  );
}