import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Wallet, Plus } from 'lucide-react';
import { rupiah, tanggal } from '@/lib/utils';

const STATUS_TONE: Record<string, 'gray' | 'blue' | 'orange' | 'green' | 'red'> = {
  draf: 'gray', diajukan: 'blue',
  diverifikasi_operasional: 'blue', diverifikasi_keuangan: 'blue',
  disetujui: 'green', dibayar: 'green', dibukukan: 'green',
  ditolak: 'red', dibatalkan: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  draf: 'Draf', diajukan: 'Diajukan',
  diverifikasi_operasional: 'Verifikasi Ops', diverifikasi_keuangan: 'Verifikasi Keu',
  disetujui: 'Disetujui', dibayar: 'Dibayar', dibukukan: 'Dibukukan',
  ditolak: 'Ditolak', dibatalkan: 'Dibatalkan',
};

export default async function PengeluaranListPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const bolehLihat = punya(ctx, 'biaya.lihat_ringkasan') || punya(ctx, 'biaya.lihat_rinci');
  const bolehLihatNilai = punya(ctx, 'biaya.lihat_rinci');
  if (!bolehLihat) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Biaya', href: '/biaya' }, { label: 'Pengeluaran' }]} />
        <PageHeader title="Pengeluaran" />
        <Card><EmptyState title="Akses terbatas" description="Anda tidak memiliki hak melihat data biaya." /></Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('pengeluaran')
    .select('id, nomor, tanggal, nilai, status, jenis, klasifikasi, kegiatan:kegiatan_id(id,nomor,nama), kategori:kategori_biaya_id(kode,nama), vendor:vendor_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .limit(200);

  const bolehKelola = punya(ctx, 'biaya.kelola');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Biaya', href: '/biaya' }, { label: 'Pengeluaran' }]} />
      <PageHeader title="Pengeluaran" subtitle="Semua dokumen pengeluaran biaya operasional."
        actions={bolehKelola && (
          <Link href="/biaya/pengeluaran/baru">
            <Button variant="primary"><Plus size={14} /> Pengeluaran Baru</Button>
          </Link>
        )} />

      {(!data || data.length === 0) ? (
        <Card><EmptyState icon={<Wallet size={20} />} title="Belum ada pengeluaran"
          action={bolehKelola ? (
            <Link href="/biaya/pengeluaran/baru">
              <Button variant="primary"><Plus size={14} /> Pengeluaran Baru</Button>
            </Link>
          ) : undefined} /></Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Nomor</TH><TH>Tanggal</TH><TH>Kategori</TH><TH>Kegiatan</TH><TH>Vendor</TH>
            {bolehLihatNilai && <TH align="right">Nilai</TH>}
            <TH>Status</TH>
          </THead>
          <TBody>
            {data.map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">
                  <Link href={`/biaya/pengeluaran/${r.id}`} className="text-blue hover:underline">{r.nomor}</Link>
                </TD>
                <TD className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</TD>
                <TD>{r.kategori?.kode} · {r.kategori?.nama}</TD>
                <TD className="text-[color:var(--text-2)]">{r.kegiatan?.nomor ?? '—'}</TD>
                <TD className="text-[color:var(--text-2)]">{r.vendor?.nama ?? '—'}</TD>
                {bolehLihatNilai && <TD align="right" className="font-medium">{rupiah(Number(r.nilai))}</TD>}
                <TD><Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{STATUS_LABEL[r.status] ?? r.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}