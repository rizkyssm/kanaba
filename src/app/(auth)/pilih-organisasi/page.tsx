import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { keluarAction } from '@/features/auth/actions';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Building2, Mail, LogOut, RefreshCw, Info } from 'lucide-react';
import Link from 'next/link';

export default async function PilihOrganisasiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/masuk');

  const { data: anggota } = await supabase
    .from('anggota_organisasi')
    .select('id, status, organisasi:organisasi_id (id, nama)')
    .eq('profil_id', user.id)
    .eq('status', 'aktif');

  // Jika user sudah punya organisasi → langsung ke beranda
  if (anggota && anggota.length > 0) redirect('/beranda');

  // Ambil profil untuk menampilkan nama & inisial
  const { data: profil } = await supabase
    .from('profil')
    .select('nama_lengkap, email')
    .eq('id', user.id)
    .maybeSingle();

  const nama = profil?.nama_lengkap ?? user.email ?? 'Pengguna';
  const email = profil?.email ?? user.email ?? '';

  return (
    <div className="min-h-screen bg-[color:var(--bg-subtle)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] space-y-5">

        {/* Brand mark */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-blue/10 text-blue">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-[17px] font-semibold tracking-tight">Pilih Organisasi</div>
            <p className="text-[13px] text-[color:var(--text-2)] mt-0.5">
              Akun Anda belum terhubung ke organisasi mana pun
            </p>
          </div>
        </div>

        {/* Kartu identitas pengguna */}
        <Card>
          <CardBody className="py-5">
            <div className="flex items-center gap-3">
              <Avatar nama={nama} size={44} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold truncate">{nama}</div>
                <div className="text-[12px] text-[color:var(--text-2)] truncate flex items-center gap-1.5 mt-0.5">
                  <Mail size={11} />
                  {email}
                </div>
              </div>
              <Badge tone="gray">Belum Terhubung</Badge>
            </div>
          </CardBody>
        </Card>

        {/* Informasi langkah selanjutnya */}
        <Card>
          <CardBody className="py-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[color:var(--blue-soft)] text-[color:var(--blue-fg)] flex items-center justify-center shrink-0">
                <Info size={15} />
              </div>
              <div className="text-[13px] leading-relaxed">
                <p className="font-medium text-[color:var(--text)]">
                  Apa yang perlu dilakukan?
                </p>
                <p className="text-[color:var(--text-2)] mt-1">
                  Mintalah administrator organisasi Anda untuk mengundang email
                  <span className="font-medium text-[color:var(--text)]"> {email} </span>
                  ke salah satu organisasi KANABA. Setelah diundang, klik
                  <span className="font-medium text-[color:var(--text)]"> Periksa Ulang</span> di bawah.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Aksi */}
        <div className="space-y-2">
          <Link href="/pilih-organisasi" className="block">
            <Button variant="primary" size="lg" className="w-full">
              <RefreshCw size={15} />
              Periksa Ulang
            </Button>
          </Link>

          <form action={keluarAction}>
            <Button type="submit" variant="secondary" size="lg" className="w-full">
              <LogOut size={15} />
              Keluar dari Akun
            </Button>
          </form>
        </div>

        {/* Footer kecil */}
        <p className="text-center text-[11px] text-[color:var(--text-3)]">
          Punya pertanyaan? Hubungi admin organisasi KANABA Anda.
        </p>
      </div>
    </div>
  );
}