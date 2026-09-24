'use client';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function NotificationBell({ jumlah }: { jumlah: number }) {
  const pathname = usePathname();
  const aktif = pathname.startsWith('/notifikasi');

  return (
    <Link
      href="/notifikasi"
      className={
        'relative w-9 h-9 rounded-full flex items-center justify-center focus-ring ' +
        (aktif ? 'bg-[color:var(--bg-subtle)]' : 'hover:bg-[color:var(--bg-hover)]')
      }
    >
      <Bell size={16} className="text-[color:var(--text-2)]" />
      {jumlah > 0 && (
        <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-red text-white text-[9px] font-semibold flex items-center justify-center tnum">
          {jumlah > 99 ? '99+' : jumlah}
        </span>
      )}
    </Link>
  );
}