import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks } from '@/lib/auth/permissions';
import StatusBadge from '@/features/kegiatan/StatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { tanggal } from '@/lib/utils';

const KOLOM = [
  { key: 'direncanakan', label: 'Direncanakan', match: ['draf', 'direncanakan', 'menunggu_persetujuan', 'disetujui'] },
  { key: 'persiapan',    label: 'Persiapan',    match: ['persiapan', 'dikirim_ke_site'] },
  { key: 'di_site',      label: 'Di Site',      match: ['di_site', 'sedang_berjalan'] },
  { key: 'selesai',      label: 'Selesai',      match: ['selesai'] },
  { key: 'rekonsiliasi', label: 'Rekonsiliasi', match: ['rekonsiliasi'] },
  { key: 'ditutup',      label: 'Ditutup',      match: ['ditutup', 'dibatalkan'] },
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
    <div className="space-y-6">
      <PageHeader
        title="Alur"
        subtitle="Pipeline kegiatan dari perencanaan hingga penutupan."
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada kegiatan"
            description="Buat kegiatan baru untuk melihat alurnya di sini."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {KOLOM.map((k) => {
            const isi = items.filter((it: any) => k.match.includes(it.status));
            return (
              <div key={k.key} className="rounded-[var(--radius-lg)] border bg-[color:var(--bg-inset)] overflow-hidden">
                <div className="px-3 py-2.5 border-b bg-[color:var(--bg-elev)] flex items-center justify-between">
                  <span className="text-[13px] font-medium">{k.label}</span>
                  <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-[color:var(--bg-subtle)] text-[11px] tnum text-[color:var(--text-2)]">
                    {isi.length}
                  </span>
                </div>
                <div className="p-2 space-y-2 max-h-[65vh] overflow-y-auto">
                  {isi.length === 0 ? (
                    <div className="text-[12px] text-[color:var(--text-3)] text-center py-6">
                      Kosong
                    </div>
                  ) : (
                    isi.map((it: any) => (
                      <Link
                        key={it.id}
                        href={`/kegiatan/${it.id}`}
                        className="block rounded-[var(--radius-md)] border bg-[color:var(--bg-elev)] p-2.5 hover:border-blue hover:shadow-[var(--shadow-xs)] transition"
                      >
                        <div className="font-mono text-[10px] text-[color:var(--text-3)]">{it.nomor}</div>
                        <div className="text-[13px] font-medium leading-tight mt-0.5 line-clamp-2">
                          {it.nama}
                        </div>
                        <div className="text-[11px] text-[color:var(--text-2)] mt-1">
                          {it.site?.kode} · {tanggal(it.tanggal)}
                        </div>
                        <div className="mt-2">
                          <StatusBadge status={it.status} />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}