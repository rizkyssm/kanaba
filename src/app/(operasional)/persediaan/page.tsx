import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';

export default async function PersediaanPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: saldo } = await supabase
    .from('v_saldo_persediaan')
    .select('material_id, site_id, saldo, material:material_id(kode,nama), site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('material_id');

  const bolehKelola = punya(ctx, 'persediaan.kelola');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Persediaan</h1>
          <p className="text-sm text-[color:var(--text-2)]">Saldo per material dan per site.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/persediaan/pengeluaran" className="rounded border border-[color:var(--border)] px-3 py-2 text-sm">Riwayat Pengeluaran</Link>
          {bolehKelola && (
            <Link href="/persediaan/pengeluaran/baru" className="rounded bg-blue text-white px-3 py-2 text-sm font-medium">
              Pengeluaran Material
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead><tr><th>Material</th><th>Site</th><th className="text-right">Saldo</th></tr></thead>
          <tbody>
            {(!saldo || saldo.length === 0) && (
              <tr><td colSpan={3} className="text-center text-[color:var(--text-2)] py-6">
                Belum ada transaksi persediaan.
              </td></tr>
            )}
            {(saldo ?? []).map((r: any, idx: number) => (
              <tr key={idx}>
                <td>{r.material?.kode} · {r.material?.nama}</td>
                <td className="text-[color:var(--text-2)]">{r.site?.kode ?? '—'}</td>
                <td className="text-right tabular-nums">{Number(r.saldo).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}