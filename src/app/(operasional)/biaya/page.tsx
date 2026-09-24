import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Wallet, Plus, TrendingUp, Receipt } from 'lucide-react';
import { rupiah } from '@/lib/utils';

export default async function BiayaPage() {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const bolehRingkas = punya(ctx, 'biaya.lihat_ringkasan');
  const bolehRinci = punya(ctx, 'biaya.lihat_rinci');
  const bolehKelola = punya(ctx, 'biaya.kelola');

  if (!bolehRingkas && !bolehRinci) {
    return (
      <div className="space-y-6">
        <PageHeader title="Biaya" />
        <Card><EmptyState title="Akses terbatas"
          description="Anda tidak memiliki hak melihat data biaya." /></Card>
      </div>
    );
  }

  const supabase = await createClient();
  const bulanIni = new Date();
  const awalBulan = new Date(bulanIni.getFullYear(), bulanIni.getMonth(), 1).toISOString().slice(0, 10);

  const [
    { data: perStatus },
    { data: perBulanIni },
    { data: topKegiatan },
  ] = await Promise.all([
    supabase.from('pengeluaran')
      .select('jenis, klasifikasi, nilai, status')
      .eq('organisasi_id', ctx.organisasiId)
      .in('status', ['disetujui','dibayar','dibukukan']),
    supabase.from('pengeluaran')
      .select('nilai')
      .eq('organisasi_id', ctx.organisasiId)
      .gte('tanggal', awalBulan)
      .in('status', ['disetujui','dibayar','dibukukan']),
    supabase.from('v_biaya_per_bcm')
      .select('kegiatan_id, nomor, nama, aktual_bcm, biaya_per_bcm_total, total_biaya')
      .eq('organisasi_id', ctx.organisasiId)
      .gt('aktual_bcm', 0)
      .order('biaya_per_bcm_total', { ascending: false })
      .limit(8),
  ]);

  const sum = (arr: any[], key: string) => arr.reduce((s, r) => s + Number(r[key] || 0), 0);
  const totalAll = sum(perStatus ?? [], 'nilai');
  const totalOpex = sum((perStatus ?? []).filter((r: any) => r.klasifikasi === 'opex'), 'nilai');
  const totalCapex = sum((perStatus ?? []).filter((r: any) => r.klasifikasi === 'capex'), 'nilai');
  const totalLangsung = sum((perStatus ?? []).filter((r: any) => r.jenis === 'langsung'), 'nilai');
  const totalTidakLangsung = sum((perStatus ?? []).filter((r: any) => r.jenis === 'tidak_langsung'), 'nilai');
  const totalBulanIni = sum(perBulanIni ?? [], 'nilai');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biaya"
        subtitle="Ringkasan pengeluaran dan biaya per BCM."
        actions={
          <>
            <Link href="/biaya/pengeluaran">
              <Button variant="secondary"><Receipt size={14} /> Pengeluaran</Button>
            </Link>
            {bolehKelola && (
              <Link href="/biaya/pengeluaran/baru">
                <Button variant="primary"><Plus size={14} /> Pengeluaran Baru</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Bulan Ini" value={rupiah(totalBulanIni)} tone="blue" />
        <KPICard label="Total Disetujui" value={rupiah(totalAll)} />
        <KPICard label="OPEX"  value={rupiah(totalOpex)} tone="orange" />
        <KPICard label="CAPEX" value={rupiah(totalCapex)} tone="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Biaya Langsung"        value={rupiah(totalLangsung)} tone="blue" />
        <KPICard label="Biaya Tidak Langsung"  value={rupiah(totalTidakLangsung)} tone="orange" />
        <KPICard label="Selisih" value={rupiah(totalLangsung - totalTidakLangsung)} tone={totalLangsung >= totalTidakLangsung ? 'green' : 'red'} />
        <KPICard label="Status" value="Aktif" tone="green" />
      </div>

      <Section
        title="Biaya per BCM — Kegiatan Teratas"
        subtitle={bolehRinci ? 'Diurutkan dari biaya per BCM tertinggi.' : 'Nilai disembunyikan tanpa hak biaya.lihat_rinci.'}
        actions={
          <Link href="/biaya/pengeluaran">
            <Button variant="ghost" size="sm"><TrendingUp size={13} /> Detail</Button>
          </Link>
        }
      >
        {(!topKegiatan || topKegiatan.length === 0) ? (
          <Card><EmptyState icon={<Wallet size={20} />} title="Belum ada data biaya per BCM"
            description="Isi pengeluaran dengan kegiatan dan BCM aktual untuk melihat analitik." /></Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Kegiatan</TH>
              <TH align="right">BCM</TH>
              {bolehRinci && <TH align="right">Total Biaya</TH>}
              {bolehRinci && <TH align="right">Biaya / BCM</TH>}
              <TH align="right">Aksi</TH>
            </THead>
            <TBody>
              {(topKegiatan ?? []).map((r: any) => (
                <TR key={r.kegiatan_id}>
                  <TD>
                    <span className="font-mono text-[12px] text-[color:var(--text-2)]">{r.nomor}</span>
                    <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                    <span className="font-medium">{r.nama}</span>
                  </TD>
                  <TD align="right">{Number(r.aktual_bcm).toLocaleString('id-ID')}</TD>
                  {bolehRinci && <TD align="right">{rupiah(Number(r.total_biaya))}</TD>}
                  {bolehRinci && <TD align="right" className="font-medium">{rupiah(Number(r.biaya_per_bcm_total))}</TD>}
                  <TD align="right">
                    <Link href={`/kegiatan/${r.kegiatan_id}`} className="text-blue hover:underline text-[13px]">
                      Buka
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}