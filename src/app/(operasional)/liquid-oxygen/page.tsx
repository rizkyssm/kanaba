import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import FormLox from '@/features/lox/FormLox';

export default async function LoxPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const [{ data: saldo }, { data: trx }, { data: kegiatans }, { data: sites }] = await Promise.all([
    supabase.from('v_saldo_lox').select('site_id, saldo_kg, site:site_id(kode,nama)').eq('organisasi_id', ctx.organisasiId),
    supabase.from('transaksi_lox').select('id, jenis, arah, jumlah_kg, catatan, created_at, kegiatan:kegiatan_id(id,nomor)').eq('organisasi_id', ctx.organisasiId).order('created_at', { ascending: false }).limit(50),
    supabase.from('kegiatan').select('id, nomor, nama').eq('organisasi_id', ctx.organisasiId).in('status', ['direncanakan','disetujui','persiapan','dikirim_ke_site','di_site','sedang_berjalan']).limit(100),
    supabase.from('site').select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true),
  ]);

  const total = (saldo ?? []).reduce((s: number, r: any) => s + Number(r.saldo_kg || 0), 0);
  const bolehKelola = punya(ctx, 'persediaan.kelola');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Liquid Oxygen</h1>
        <p className="text-sm text-[color:var(--text-2)]">Pencatatan LOX masuk, keluar, dan pemakaian.</p>
      </div>

      <div className="rounded border border-[color:var(--border)] p-4">
        <div className="text-xs text-[color:var(--text-2)]">Total saldo seluruh site</div>
        <div className="text-2xl font-semibold tabular-nums">{total.toLocaleString('id-ID')} kg</div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {(saldo ?? []).map((r: any, i: number) => (
            <div key={i} className="rounded border border-[color:var(--border)] p-2">
              <div className="text-xs text-[color:var(--text-2)]">{r.site?.kode ?? 'Tanpa Site'}</div>
              <div className="tabular-nums">{Number(r.saldo_kg).toLocaleString('id-ID')} kg</div>
            </div>
          ))}
          {(!saldo || saldo.length === 0) && <div className="text-[color:var(--text-2)] text-sm">Belum ada saldo.</div>}
        </div>
      </div>

      {bolehKelola && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Catat Transaksi</h2>
          <FormLox kegiatans={(kegiatans ?? []) as any} sites={(sites ?? []) as any} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium">50 Transaksi Terakhir</h2>
        <div className="overflow-x-auto rounded border border-[color:var(--border)]">
          <table className="tabel">
            <thead><tr><th>Waktu</th><th>Jenis</th><th>Arah</th><th className="text-right">Jumlah (kg)</th><th>Kegiatan</th><th>Catatan</th></tr></thead>
            <tbody>
              {(!trx || trx.length === 0) && <tr><td colSpan={6} className="text-center text-[color:var(--text-2)] py-4">Belum ada transaksi.</td></tr>}
              {(trx ?? []).map((r: any) => (
                <tr key={r.id}>
                  <td className="text-xs text-[color:var(--text-2)]">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                  <td>{r.jenis}</td>
                  <td>{r.arah}</td>
                  <td className="text-right tabular-nums">{Number(r.jumlah_kg).toLocaleString('id-ID')}</td>
                  <td className="font-mono text-xs">{r.kegiatan?.nomor ?? '—'}</td>
                  <td className="text-[color:var(--text-2)]">{r.catatan ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}