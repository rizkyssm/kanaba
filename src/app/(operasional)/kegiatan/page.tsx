import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import StatusBadge from '@/features/kegiatan/StatusBadge';
import { tanggal } from '@/lib/utils';

export default async function KegiatanPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('kegiatan')
    .select('id, nomor, nama, tanggal, status, target_bcm, aktual_bcm, site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(100);

  const bolehKelola = punya(ctx, 'kegiatan.kelola');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Kegiatan</h1>
          <p className="text-sm text-[color:var(--text-2)]">Pusat transaksi operasional.</p>
        </div>
        {bolehKelola && (
          <Link href="/kegiatan/baru" className="rounded bg-blue text-white px-3 py-2 text-sm font-medium">
            Kegiatan Baru
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded border border-[color:var(--border)]">
        <table className="tabel">
          <thead>
            <tr>
              <th>Nomor</th>
              <th>Nama</th>
              <th>Site</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th className="text-right">BCM (target / aktual)</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) && (
              <tr><td colSpan={6} className="text-center text-[color:var(--text-2)] py-6">Belum ada kegiatan.</td></tr>
            )}
            {(data ?? []).map((k: any) => (
              <tr key={k.id} className="hover:bg-[color:var(--bg-2)]">
                <td className="font-mono text-xs">
                  <Link href={`/kegiatan/${k.id}`} className="hover:underline">{k.nomor}</Link>
                </td>
                <td>{k.nama}</td>
                <td className="text-[color:var(--text-2)]">{k.site?.kode} · {k.site?.nama}</td>
                <td className="text-[color:var(--text-2)]">{tanggal(k.tanggal)}</td>
                <td><StatusBadge status={k.status} /></td>
                <td className="text-right">
                  {Number(k.target_bcm).toLocaleString('id-ID')} / {Number(k.aktual_bcm).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}