'use client';
import Link from 'next/link';
import { keluarAction } from '@/features/auth/actions';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ChevronDown, User, Settings, Building2, Users, ScrollText, LogOut } from 'lucide-react';

export default function ProfileMenu({
  nama, email, organisasiNama,
}: { nama: string; email: string; organisasiNama: string }) {
  return (
    <Dropdown
      align="right"
      trigger={
        <button className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-full hover:bg-[color:var(--bg-hover)] focus-ring">
          <Avatar nama={nama} size={28} />
          <ChevronDown size={14} className="text-[color:var(--text-3)]" />
        </button>
      }
    >
      {(close) => (
        <>
          <div className="px-3 py-2 border-b">
            <div className="text-[13px] font-medium truncate">{nama || 'Pengguna'}</div>
            <div className="text-[11px] text-[color:var(--text-2)] truncate">{email}</div>
            <div className="text-[11px] text-[color:var(--text-3)] mt-1 truncate">{organisasiNama}</div>
          </div>
          <DropdownItem onClick={close}><User size={14} /> Profil & Pengaturan</DropdownItem>
          <DropdownItem onClick={close}><Settings size={14} /> Pengaturan</DropdownItem>
          <DropdownSeparator />
          <Link href="/organisasi" onClick={close}><DropdownItem><Building2 size={14} /> Organisasi</DropdownItem></Link>
          <Link href="/admin/pengguna" onClick={close}><DropdownItem><Users size={14} /> Manajemen Pengguna</DropdownItem></Link>
          <Link href="/admin/log" onClick={close}><DropdownItem><ScrollText size={14} /> Log Aktivitas</DropdownItem></Link>
          <DropdownSeparator />
          <form action={keluarAction}>
            <button type="submit" className="w-full text-left px-3 py-2 text-[13px] text-red hover:bg-[color:var(--bg-hover)] flex items-center gap-2">
              <LogOut size={14} /> Keluar
            </button>
          </form>
        </>
      )}
    </Dropdown>
  );
}