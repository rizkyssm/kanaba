import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormAset from '@/features/aset/FormAset';

export default async function AsetPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: list }, { data: sites }] = await Promise.all([
    supabase.from('aset').select('id, kode, nama, kategori, status, site:site_id(kode,nama)').eq('organisasi_id', ctx.organisasiId).order('kode'),
    supabase.from('site').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Aset</h1>
        <p className="text-sm text-[color:var(--text-2)]">Ranger Tank, kendaraan, peralatan, mesin.</p>
      </div>

      {punya(ctx, 'data_induk.kelola') && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Tambah Aset</h2>
          <FormAset sites={(sites ?? []) as any} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Daftar Aset</h2>
        <div className="overflow-x-auto rounded border border-[color:var(--border)]">
          <table className="tabel">
            <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Site</th><th>Status</th></tr></thead>
            <tbody>
              {(!list || list.length === 0) && <tr><td colSpan={5} className="text-center text-[color:var(--text-2)] py-4">Belum ada aset.</td></tr>}
              {(list ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.kode}</td>
                  <td>{r.nama}</td>
                  <td className="text-[color:var(--text-2)]">{r.kategori ?? '—'}</td>
                  <td className="text-[color:var(--text-2)]">{r.site?.kode ?? '—'}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}