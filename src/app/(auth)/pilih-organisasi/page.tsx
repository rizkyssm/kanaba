import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { keluarAction } from '@/features/auth/actions';
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

  // Kalau sudah punya organisasi → langsung ke beranda
  if (anggota && anggota.length > 0) redirect('/beranda');

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Pilih Organisasi</h1>
      <p className="text-sm text-[color:var(--text-2)]">
        Akun Anda belum terhubung ke organisasi mana pun.
        Hubungi administrator untuk diundang, atau minta admin menjalankan
        proses onboarding.
      </p>
      <div className="rounded border border-[color:var(--border)] p-3 text-sm">
        <div className="text-[color:var(--text-2)]">Email Anda</div>
        <div className="font-medium">{user.email}</div>
      </div>
      <form action={keluarAction}>
        <button className="rounded border border-[color:var(--border)] px-3 py-2 text-sm">
          Keluar
        </button>
      </form>
      <div className="text-sm text-[color:var(--text-2)]">
        Sudah diundang?{' '}
        <Link href="/beranda" className="hover:underline">Coba lagi ke Beranda</Link>
      </div>
    </div>
  );
}