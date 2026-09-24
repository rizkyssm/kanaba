import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { Card, CardBody } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import FilterAnalitik from '@/features/analitik/FilterAnalitik';
import { TrendChart, BiayaChart, DistribusiBasisChart } from '@/features/analitik/Charts';
import { rupiah } from '@/lib/utils';
import { BarChart3, TrendingUp, Download } from 'lucide-react';

type Search = Promise<{
  periode?: string; dari?: string; sampai?: string; site?: string;
}>;

function hitungRentang(periode: string, dari?: string, sampai?: string) {
  const now = new Date();
  if (periode === 'kustom' && dari && sampai) return { dari, sampai };

  if (periode === '3bulan') {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return { dari: d.toISOString().slice(0, 10), sampai: now.toISOString().slice(0, 10) };
  }
  if (periode === 'tahun') {
    const d = new Date(now.getFullYear(), 0, 1);
    return { dari: d.toISOString().slice(0, 10), sampai: now.toISOString().slice(0, 10) };
  }
  // default: bulan ini
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return { dari: d.toISOString().slice(0, 10), sampai: now.toISOString().slice(0, 10) };
}

export default async function AnalitikPage({ searchParams }: { searchParams: Search }) {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const sp = await searchParams;
  const periode = sp.periode ?? 'bulan';
  const site = sp.site ?? '';
  const { dari, sampai } = hitungRentang(periode, sp.dari, sp.sampai);

  const bolehRinci = punya(ctx, 'biaya.lihat_rinci');
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from('site').select('id, kode, nama')
    .eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama');

  // Query kegiatan
  let qKeg = supabase
    .from('kegiatan')
    .select('id, nomor, nama, basis_hasil, tanggal, aktual_bcm, aktual_lubang, aktual_lox_kg, site:site_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .gte('tanggal', dari)
    .lte('tanggal', sampai);
  if (site) qKeg = qKeg.eq('site_id', site);
  const { data: kegiatans } = await qKeg;

  // Query pengeluaran
  let qPeng = supabase
    .from('pengeluaran')
    .select('nilai, jenis, klasifikasi, tanggal, kegiatan_id, kategori:kategori_biaya_id(kode,nama)')
    .eq('organisasi_id', ctx.organisasiId)
    .gte('tanggal', dari)
    .lte('tanggal', sampai)
    .in('status', ['disetujui', 'dibayar', 'dibukukan']);
  const { data: pengeluarans } = await qPeng;

  // Query LOX
  const { data: loxTrx } = await supabase
    .from('transaksi_lox')
    .select('arah, jumlah_kg, jenis')
    .eq('organisasi_id', ctx.organisasiId)
    .gte('created_at', dari)
    .lte('created_at', sampai + 'T23:59:59');

  // Hitung agregat
  const kegList = kegiatans ?? [];
  const pengList = pengeluarans ?? [];
  const loxList = loxTrx ?? [];

  const totalBCM = kegList.reduce((s, k: any) => s + Number(k.aktual_bcm || 0), 0);
  const totalLubang = kegList.reduce((s, k: any) => s + Number(k.aktual_lubang || 0), 0);
  const totalLox = loxList
    .filter((t: any) => t.jenis === 'pengeluaran_site')
    .reduce((s: number, t: any) => s + Number(t.jumlah_kg || 0), 0);
  const totalKegiatan = kegList.length;
  const totalBiaya = pengList.reduce((s, p: any) => s + Number(p.nilai || 0), 0);

  const biayaPerBcm = totalBCM > 0 ? totalBiaya / totalBCM : 0;
  const biayaPerLubang = totalLubang > 0 ? totalBiaya / totalLubang : 0;
  const loxPerBcm = totalBCM > 0 ? totalLox / totalBCM : 0;
  const loxPerLubang = totalLubang > 0 ? totalLox / totalLubang : 0;

  // Trend — group by day
  const trendMap: Record<string, { bcm: number; lubang: number; lox: number }> = {};
  kegList.forEach((k: any) => {
    const tgl = k.tanggal;
    if (!trendMap[tgl]) trendMap[tgl] = { bcm: 0, lubang: 0, lox: 0 };
    trendMap[tgl].bcm += Number(k.aktual_bcm || 0);
    trendMap[tgl].lubang += Number(k.aktual_lubang || 0);
  });
  loxList.forEach((t: any) => {
    if (t.jenis !== 'pengeluaran_site') return;
    const tgl = new Date().toISOString().slice(0, 10);
    if (!trendMap[tgl]) trendMap[tgl] = { bcm: 0, lubang: 0, lox: 0 };
    trendMap[tgl].lox += Number(t.jumlah_kg || 0);
  });
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tgl, v]) => ({ label: tgl.slice(5), ...v }));

  // Biaya per kategori
  const kategoriMap: Record<string, { label: string; nilai: number }> = {};
  pengList.forEach((p: any) => {
    const key = p.kategori?.kode ?? 'LAIN';
    if (!kategoriMap[key]) kategoriMap[key] = { label: p.kategori?.nama ?? key, nilai: 0 };
    kategoriMap[key].nilai += Number(p.nilai || 0);
  });
  const biayaData = Object.values(kategoriMap).sort((a, b) => b.nilai - a.nilai).slice(0, 8);

  // Distribusi basis
  const basisMap: Record<string, number> = {};
  kegList.forEach((k: any) => {
    const b = k.basis_hasil ?? 'per_bcm';
    basisMap[b] = (basisMap[b] ?? 0) + 1;
  });
  const basisLabel: Record<string, string> = {
    per_bcm: 'Per BCM', per_lubang: 'Per Lubang',
    per_kegiatan: 'Per Kegiatan', per_jam: 'Per Jam',
  };
  const basisData = Object.entries(basisMap).map(([k, v]) => ({
    label: basisLabel[k] ?? k, jumlah: v,
  }));

  // Breakdown per site
  const siteMap: Record<string, { nama: string; bcm: number; lubang: number; kegiatan: number }> = {};
  kegList.forEach((k: any) => {
    const key = k.site?.kode ?? 'lain';
    if (!siteMap[key]) siteMap[key] = { nama: k.site?.nama ?? '—', bcm: 0, lubang: 0, kegiatan: 0 };
    siteMap[key].bcm += Number(k.aktual_bcm || 0);
    siteMap[key].lubang += Number(k.aktual_lubang || 0);
    siteMap[key].kegiatan += 1;
  });
  const siteRows = Object.entries(siteMap);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analitik"
        subtitle={`Periode ${dari} s/d ${sampai}${site ? ' · Site terpilih' : ' · Semua site'}`}
        actions={
          <Link href={`/api/laporan/analitik-kegiatan?dari=${dari}&sampai=${sampai}${site ? `&site=${site}` : ''}`}>
            <Button variant="secondary"><Download size={14} /> Export CSV</Button>
          </Link>
        }
      />

      <FilterAnalitik
        sites={(sites ?? []) as any}
        nilaiAwal={{ periode, dari: sp.dari ?? dari, sampai: sp.sampai ?? sampai, site }}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total BCM"      value={totalBCM.toLocaleString('id-ID')} tone="blue" />
        <KPICard label="Total Lubang"   value={totalLubang.toLocaleString('id-ID')} tone="orange" />
        <KPICard label="Total LOX"      value={`${totalLox.toLocaleString('id-ID')} kg`} tone="green" />
        <KPICard label="Kegiatan"       value={totalKegiatan} />
      </div>

      {bolehRinci ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="Total Biaya"    value={rupiah(totalBiaya)} />
          <KPICard label="Biaya / BCM"    value={rupiah(biayaPerBcm)} tone="blue" />
          <KPICard label="Biaya / Lubang" value={rupiah(biayaPerLubang)} tone="orange" />
          <KPICard label="LOX / BCM"      value={`${loxPerBcm.toFixed(3)} kg`} tone="green" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard label="LOX / BCM"      value={`${loxPerBcm.toFixed(3)} kg`} tone="green" />
          <KPICard label="LOX / Lubang"   value={`${loxPerLubang.toFixed(3)} kg`} tone="orange" />
          <KPICard label="Rata-rata BCM / Kegiatan" value={(totalKegiatan > 0 ? totalBCM / totalKegiatan : 0).toFixed(1)} />
          <KPICard label="Rata-rata Lubang / Kegiatan" value={(totalKegiatan > 0 ? totalLubang / totalKegiatan : 0).toFixed(1)} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <TrendingUp size={14} className="text-[color:var(--text-2)]" />
            <div className="text-[15px] font-semibold">Tren BCM, Lubang & LOX</div>
          </div>
          <CardBody>
            {trendData.length === 0 ? (
              <EmptyState title="Belum ada data tren" />
            ) : (
              <TrendChart data={trendData} />
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <BarChart3 size={14} className="text-[color:var(--text-2)]" />
            <div className="text-[15px] font-semibold">Distribusi Basis</div>
          </div>
          <CardBody>
            {basisData.length === 0 ? (
              <EmptyState title="Belum ada kegiatan" />
            ) : (
              <DistribusiBasisChart data={basisData} />
            )}
          </CardBody>
        </Card>
      </div>

      {bolehRinci && biayaData.length > 0 && (
        <Card>
          <div className="px-5 py-4 border-b">
            <div className="text-[15px] font-semibold">Biaya per Kategori</div>
            <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
              Top 8 kategori berdasarkan total pengeluaran periode ini.
            </p>
          </div>
          <CardBody>
            <BiayaChart data={biayaData} />
          </CardBody>
        </Card>
      )}

      <Section title="Ringkasan per Site" subtitle={`${siteRows.length} site dengan kegiatan pada periode ini`}>
        {siteRows.length === 0 ? (
          <Card><EmptyState title="Belum ada data per site" /></Card>
        ) : (
          <TableWrap className="bg-[color:var(--bg-elev)]">
            <THead>
              <TH>Site</TH>
              <TH align="right">Kegiatan</TH>
              <TH align="right">BCM</TH>
              <TH align="right">Lubang</TH>
            </THead>
            <TBody>
              {siteRows.map(([kode, s]) => (
                <TR key={kode}>
                  <TD>
                    <span className="font-mono text-[12px] text-[color:var(--text-2)]">{kode}</span>
                    <span className="mx-1.5 text-[color:var(--text-3)]">·</span>
                    <span className="font-medium">{s.nama}</span>
                  </TD>
                  <TD align="right">{s.kegiatan}</TD>
                  <TD align="right">{s.bcm.toLocaleString('id-ID')}</TD>
                  <TD align="right">{s.lubang.toLocaleString('id-ID')}</TD>
                </TR>
              ))}
            </TBody>
          </TableWrap>
        )}
      </Section>
    </div>
  );
}