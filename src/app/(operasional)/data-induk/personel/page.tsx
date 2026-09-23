import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormPersonel from '@/features/personel/FormPersonel';

export default async function PersonelPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const bolehGaji = punya(ctx, 'gaji.lihat');
  const bolehKelola = punya(ctx, 'data_induk.kelola');

  const supabase = await createClient();
  const { data: list } = await supabase
    .from('personel')
    .select(`id, nama, tipe, telepon, keahlian, aktif,
      kompensasi:personel_kompensasi(tarif, jenis_tarif)`)
    .eq('organisasi_id', ctx.organisasiId)
    .order('nama');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Personel</h1>
        <p className="text-sm text-[color:var(--text-2)]">Karyawan, tenaga lepas, dan vendor.</p>
      </div>

      {bolehKelola && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Tambah Personel</h2>
          <FormPersonel bolehGaji={bolehGaji} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Daftar Personel</h2>
        <div className="overflow-x-auto rounded border border-[color:var(--border)]">
          <table className="tabel">
            <thead>
              <tr>
                <th>Nama</th><th>Tipe</th><th>Keahlian</th><th>Telepon</th><th>Status</th>
                {bolehGaji && <th className="text-right">Tarif</th>}
              </tr>
            </thead>
            <tbody>
              {(!list || list.length === 0) && (
                <tr><td colSpan={bolehGaji ? 6 : 5} className="text-center text-[color:var(--text-2)] py-4">Belum ada personel.</td></tr>
              )}
              {(list ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td>{r.nama}</td>
                  <td className="text-[color:var(--text-2)]">{r.tipe}</td>
                  <td className="text-[color:var(--text-2)]">{r.keahlian ?? '—'}</td>
                  <td className="text-[color:var(--text-2)]">{r.telepon ?? '—'}</td>
                  <td>{r.aktif ? 'Aktif' : 'Nonaktif'}</td>
                  {bolehGaji && (
                    <td className="text-right tabular-nums">
                      {r.kompensasi?.tarif != null
                        ? `Rp ${Number(r.kompensasi.tarif).toLocaleString('id-ID')} / ${r.kompensasi.jenis_tarif ?? ''}`
                        : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}