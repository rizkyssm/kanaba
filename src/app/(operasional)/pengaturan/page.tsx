import Link from 'next/link';
import { getKonteks } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { ShieldCheck, User, Bell, ChevronRight } from 'lucide-react';

const ITEM = [
  { href: '/pengaturan/keamanan',     label: 'Keamanan & MFA',   desc: 'Kelola 2FA, sesi, dan password.', icon: ShieldCheck },
  { href: '/pengaturan/profil',       label: 'Profil',           desc: 'Nama, kontak, dan preferensi akun.', icon: User },
  { href: '/notifikasi',              label: 'Notifikasi',       desc: 'Lihat semua notifikasi Anda.', icon: Bell },
];

export default async function PengaturanPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" subtitle="Kelola akun dan preferensi Anda." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {ITEM.map((i) => {
          const Icon = i.icon;
          return (
            <Link key={i.href} href={i.href} className="group">
              <Card className="h-full transition group-hover:border-blue">
                <CardBody className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[color:var(--bg-subtle)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[color:var(--text-2)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium">{i.label}</div>
                    <div className="text-[12px] text-[color:var(--text-2)] mt-0.5">{i.desc}</div>
                  </div>
                  <ChevronRight size={16} className="text-[color:var(--text-3)] shrink-0 mt-1" />
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}