import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { StatRow } from '@/components/ui/StatRow';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ApprovalBar from '@/features/biaya/ApprovalBar';
import { rupiah, tanggal } from '@/lib/utils';

type Params = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, string> = {
  draf: 'Draf', diajukan: 'Diajukan',
  diverifikasi_operasional: 'Verifikasi Operasional', diverifikasi_keuangan: 'Verifikasi Keuangan',
  disetujui: 'Disetujui', dibayar: 'Dibayar', dibukukan: 'Dibukukan',
  ditolak: 'Ditolak', dibatalkan: 'Dibatalkan',
};

export default async function PengeluaranDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: p } = await supabase
    .from('pengeluaran')
    .select(`
      *,
      kategori:kategori_biaya_id(kode,nama,jenis,klasifikasi),
      pusat:pusat_biaya_id(kode,nama),
      vendor:vendor_id(kode,nama),
      site:site_id(kode,nama),
      kegiatan:kegiatan_id(id,nomor,nama)
    `)
    .eq('id', id).eq('organisasi_id', ctx.organisasiId).single();
  if (!p) notFound();

  const bolehRinci = punya(ctx, 'biaya.lihat_rinci');
  const bolehKelola = punya(ctx, 'biaya.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Biaya', href: '/biaya' },
        { label: 'Pengeluaran', href: '/biaya/pengeluaran' },
        { label: p.nomor },
      ]} />

      <PageHeader
        title={p.nomor}
        subtitle={`${p.kategori?.kode ?? ''} · ${p.kategori?.nama ?? ''}`}
        actions={<Link href="/biaya/pengeluaran"><Button variant="secondary">Kembali</Button></Link>}
      />

      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <Badge tone={
              p.status === 'dibukukan' || p.status === 'dibayar' ? 'green'
              : p.status === 'ditolak' ? 'red'
              : p.status === 'draf' ? 'gray' : 'blue'
            }>{STATUS_LABEL[p.status] ?? p.status}</Badge>
            {bolehRinci && (
              <div className="text-[20px] font-semibold tnum">{rupiah(Number(p.nilai))}</div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <StatRow label="Tanggal" value={tanggal(p.tanggal)} />
            <StatRow label="Jenis" value={p.jenis === 'langsung' ? 'Langsung' : 'Tidak Langsung'} />
            <StatRow label="Klasifikasi" value={p.klasifikasi.toUpperCase()} />
            <StatRow label="Cara Pembayaran" value={p.cara_pembayaran} />
            <StatRow label="Kategori" value={`${p.kategori?.kode} · ${p.kategori?.nama}`} />
            <StatRow label="Pusat Biaya" value={p.pusat ? `${p.pusat.kode} · ${p.pusat.nama}` : '—'} />
            <StatRow label="Vendor" value={p.vendor ? `${p.vendor.kode} · ${p.vendor.nama}` : '—'} />
            <StatRow label="Site" value={p.site ? `${p.site.kode} · ${p.site.nama}` : '—'} />
            <StatRow label="Kegiatan" value={p.kegiatan ? `${p.kegiatan.nomor} · ${p.kegiatan.nama}` : '—'} />
          </div>
          {p.catatan && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--text-3)] mb-1.5">Catatan</div>
              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{p.catatan}</p>
            </div>
          )}
          {p.alasan_penolakan && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--red-fg)] mb-1.5">Alasan Penolakan</div>
              <p className="text-[13px] whitespace-pre-wrap">{p.alasan_penolakan}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <ApprovalBar pengeluaranId={p.id} status={p.status} bolehKelola={bolehKelola} />
    </div>
  );
}