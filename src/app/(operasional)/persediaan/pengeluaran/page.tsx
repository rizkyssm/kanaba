import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { tanggal } from '@/lib/utils';

export default async function PengeluaranList() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('pengeluaran_material')
    .select('id, nomor, tanggal, status, kegiatan:kegiatan_id(id,nomor,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/persediaan" className="text-sm text-[color:var(--text-2)] hover:underline">← Persediaan</Link>
          <h1 className="text-xl font-semibold mt-1">Riwayat Pengeluaran Material</h1>
        </div>
        {punya(ctx, 'persediaan.kelola') && (
          <Link href="/persediaan/pengeluaran/baru" className="rounded bg-blue text-white px-3 py-2 text-sm font-medium">
            Pengeluaran Baru
          </Link>
        )}
      </div>
      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead><tr><th>Nomor</th><th>Tanggal</th><th>Kegiatan</th><th>Status</th></tr></thead>
          <tbody>
            {(!data || data.length === 0) && <tr><td colSpan={4} className="text-center text-[color:var(--text-2)] py-6">Belum ada pengeluaran.</td></tr>}
            {(data ?? []).map((r: any) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.nomor}</td>
                <td className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</td>
                <td><Link href={`/kegiatan/${r.kegiatan?.id}`} className="hover:underline">{r.kegiatan?.nomor} · {r.kegiatan?.nama}</Link></td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}