import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { redirect } from 'next/navigation';

export default async function PenggunaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;
  if (!punya(ctx, 'pengguna.kelola')) redirect('/beranda');

  const supabase = await createClient();
  const { data: anggota } = await supabase
    .from('anggota_organisasi')
    .select('id, status, profil:profil_id (id, nama_lengkap, email), organisasi_id')
    .eq('organisasi_id', ctx.organisasiId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Pengguna</h1>
      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead>
            <tr><th>Nama</th><th>Email</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(anggota ?? []).map((a: any) => (
              <tr key={a.id}>
                <td>{a.profil?.nama_lengkap}</td>
                <td className="text-[color:var(--text-2)]">{a.profil?.email}</td>
                <td>{a.status}</td>
              </tr>
            ))}
            {(!anggota || anggota.length === 0) && (
              <tr><td colSpan={3} className="text-center text-[color:var(--text-2)] py-6">Belum ada pengguna.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}