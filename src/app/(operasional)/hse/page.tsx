import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormHse from '@/features/hse/FormHse';

export default async function HsePage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: list }, { data: kegiatans }, { data: sites }] = await Promise.all([
    supabase.from('catatan_hse').select('id, jenis, judul, tingkat, status, created_at, kegiatan:kegiatan_id(id,nomor)').eq('organisasi_id', ctx.organisasiId).order('created_at', { ascending: false }).limit(100),
    supabase.from('kegiatan').select('id, nomor, nama').eq('organisasi_id', ctx.organisasiId).limit(100),
    supabase.from('site').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">HSE</h1>
        <p className="text-sm text-[color:var(--text-2)]">Catatan pemeriksaan, temuan, insiden, dan tindakan perbaikan.</p>
      </div>

      {punya(ctx, 'kegiatan.kelola') && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Catatan Baru</h2>
          <FormHse kegiatans={(kegiatans ?? []) as any} sites={(sites ?? []) as any} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Daftar Catatan</h2>
        <div className="overflow-x-auto rounded border border-[color:var(--border)]">
          <table className="tabel">
            <thead><tr><th>Waktu</th><th>Jenis</th><th>Judul</th><th>Tingkat</th><th>Status</th><th>Kegiatan</th></tr></thead>
            <tbody>
              {(!list || list.length === 0) && <tr><td colSpan={6} className="text-center text-[color:var(--text-2)] py-4">Belum ada catatan.</td></tr>}
              {(list ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td className="text-xs text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                  <td>{r.jenis}</td>
                  <td>{r.judul}</td>
                  <td>{r.tingkat}</td>
                  <td>{r.status}</td>
                  <td className="font-mono text-xs">
                    {r.kegiatan?.id ? <Link href={`/kegiatan/${r.kegiatan.id}?tab=hse`} className="hover:underline">{r.kegiatan.nomor}</Link> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}