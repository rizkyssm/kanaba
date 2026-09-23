import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import StatusBadge from '@/features/kegiatan/StatusBadge';

const KOLOM = [
  { key: 'direncanakan', label: 'Direncanakan', match: ['draf','direncanakan','menunggu_persetujuan','disetujui'] },
  { key: 'persiapan',    label: 'Persiapan',    match: ['persiapan','dikirim_ke_site'] },
  { key: 'di_site',      label: 'Di Site',      match: ['di_site','sedang_berjalan'] },
  { key: 'selesai',      label: 'Selesai',      match: ['selesai'] },
  { key: 'rekonsiliasi', label: 'Rekonsiliasi', match: ['rekonsiliasi'] },
  { key: 'ditutup',      label: 'Ditutup',      match: ['ditutup','dibatalkan'] },
];

export default async function AlurPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('kegiatan')
    .select('id, nomor, nama, status, tanggal, site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(300);

  const items = data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Alur</h1>
        <p className="text-sm text-[color:var(--text-2)]">Pipeline kegiatan dari perencanaan hingga penutupan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KOLOM.map((k) => {
          const isi = items.filter((it: any) => k.match.includes(it.status));
          return (
            <div key={k.key} className="rounded border border-[color:var(--border)] bg-[color:var(--bg-2)]/40">
              <div className="px-3 py-2 border-b border-[color:var(--border)] flex items-center justify-between">
                <span className="text-sm font-medium">{k.label}</span>
                <span className="text-xs text-[color:var(--text-2)]">{isi.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {isi.length === 0 && <div className="text-xs text-[color:var(--text-2)] text-center py-4">Kosong</div>}
                {isi.map((it: any) => (
                  <Link
                    key={it.id}
                    href={`/kegiatan/${it.id}`}
                    className="block rounded border border-[color:var(--border)] bg-[color:var(--bg)] p-2 hover:border-blue"
                  >
                    <div className="font-mono text-[10px] text-[color:var(--text-2)]">{it.nomor}</div>
                    <div className="text-sm font-medium leading-tight line-clamp-2">{it.nama}</div>
                    <div className="text-[11px] text-[color:var(--text-2)] mt-1">{it.site?.kode}</div>
                    <div className="mt-1"><StatusBadge status={it.status} /></div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}