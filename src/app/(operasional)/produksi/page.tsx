import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Factory, Plus } from 'lucide-react';
import { tanggal } from '@/lib/utils';

const STATUS_TONE: Record<string, 'gray' | 'green' | 'red'> = {
  draf: 'gray', selesai: 'green', dibatalkan: 'red',
};
const STATUS_LABEL: Record<string, string> = {
  draf: 'Draf', selesai: 'Selesai', dibatalkan: 'Dibatalkan',
};

export default async function ProduksiPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: list } = await supabase
    .from('produksi')
    .select('id, nomor, tanggal, jumlah_produksi, hasil_baik, status, produk:produk_id(kode,nama), site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  const total = list?.length ?? 0;
  const bulanIni = (list ?? []).filter((r: any) =>
    new Date(r.tanggal).getMonth() === new Date().getMonth() &&
    new Date(r.tanggal).getFullYear() === new Date().getFullYear()
  ).length;
  const totalBaik = (list ?? []).reduce((s: number, r: any) => s + Number(r.hasil_baik || 0), 0);
  const bolehKelola = punya(ctx, 'produksi.kelola');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produksi"
        subtitle="Catatan produksi KANABA dan produk jadi."
        actions={bolehKelola && (
          <Link href="/produksi/baru">
            <Button variant="primary"><Plus size={14} /> Produksi Baru</Button>
          </Link>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Catatan" value={total} />
        <KPICard label="Bulan Ini"     value={bulanIni} tone="blue" />
        <KPICard label="Total Hasil Baik" value={totalBaik.toLocaleString('id-ID')} tone="green" />
        <KPICard label="Status"        value="Aktif" tone="green" />
      </div>

      {(!list || list.length === 0) ? (
        <Card>
          <EmptyState
            icon={<Factory size={20} />}
            title="Belum ada produksi"
            description="Catat produksi KANABA harian di sini."
            action={bolehKelola ? (
              <Link href="/produksi/baru">
                <Button variant="primary"><Plus size={14} /> Produksi Baru</Button>
              </Link>
            ) : undefined}
          />
        </Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            <TH>Nomor</TH>
            <TH>Tanggal</TH>
            <TH>Produk</TH>
            <TH>Site</TH>
            <TH align="right">Jumlah</TH>
            <TH align="right">Hasil Baik</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {(list ?? []).map((r: any) => (
              <TR key={r.id}>
                <TD className="font-mono text-[12px]">
                  <Link href={`/produksi/${r.id}`} className="text-blue hover:underline">{r.nomor}</Link>
                </TD>
                <TD className="text-[color:var(--text-2)]">{tanggal(r.tanggal)}</TD>
                <TD className="font-medium">{r.produk ? `${r.produk.kode} · ${r.produk.nama}` : '—'}</TD>
                <TD className="text-[color:var(--text-2)]">{r.site?.kode ?? '—'}</TD>
                <TD align="right">{Number(r.jumlah_produksi).toLocaleString('id-ID')}</TD>
                <TD align="right" className="text-[color:var(--green-fg)] font-medium">
                  {Number(r.hasil_baik).toLocaleString('id-ID')}
                </TD>
                <TD><Badge tone={STATUS_TONE[r.status] ?? 'gray'}>{STATUS_LABEL[r.status] ?? r.status}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}