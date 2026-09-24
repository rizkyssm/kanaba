import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPIStat } from '@/features/analitik/KPIStat';
import FilterBar from '@/features/analitik/FilterBar';
import { TrendComboChart, DonutChart, DonutLegend, RankedBarList } from '@/features/analitik/Charts';
import { RankedTable } from '@/features/analitik/RankedTable';
import { rupiah } from '@/lib/utils';
import { Download } from 'lucide-react';

type Search = Promise<{
  periode?: string;
  dari?: string;
  sampai?: string;
  site?: string;
  basis?: string;
}>;

function hitungRentang(periode: string, dari?: string, sampai?: string) {
  const now = new Date();
  if (periode === 'kustom' && dari && sampai) return { dari, sampai };

  if (periode === 'harian') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { dari: d.toISOString().slice(0, 10), sampai: now.toISOString().slice(0, 10) };
  }
  if (periode === 'tahunan') {
    const d = new Date(now.getFullYear(), 0, 1);
    return { dari: d.toISOString().slice(0, 10), sampai: now.toISOString().slice(0, 10) };
  }
  // default bulanan
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return { dari: d.toISOString().slice(0, 10), sampai: now.toISOString().slice(0, 10) };
}

function rentangSebelumnya(dari: string, sampai: string) {
  const d1 = new Date(dari);
  const d2 = new Date(sampai);
  const hari = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1);
  const prevSampai = new Date(d1);
  prevSampai.setDate(prevSampai.getDate() - 1);
  const prevDari = new Date(prevSampai);
  prevDari.setDate(prevDari.getDate() - hari + 1);
  return {
    dari: prevDari.toISOString().slice(0, 10),
    sampai: prevSampai.toISOString().slice(0, 10),
  };
}

export default async function AnalitikPage({ searchParams }: { searchParams: Search }) {
  const ctx = await getKonteks();
  if (!ctx) return null;

  const sp = await searchParams;
  const periode = sp.periode ?? 'bulanan';
  const site = sp.site ?? '';
  const basis = sp.basis ?? '';
  const { dari, sampai } = hitungRentang(periode, sp.dari, sp.sampai);
  const prev = rentangSebelumnya(dari, sampai);

  const bolehRinci = punya(ctx, 'biaya.lihat_rinci');
  const supabase = await createClient();
  const org = ctx.organisasiId;

  const { data: sites } = await supabase
    .from('site').select('id, kode, nama')
    .eq('organisasi_id', org).eq('aktif', true).order('nama');

  // ---- Query periode saat ini ----
  let qKeg = supabase
    .from('kegiatan')
    .select('id, nomor, nama, basis_hasil, tanggal, aktual_bcm, aktual_lubang, aktual_lox_kg, site:site_id(kode,nama)')
    .eq('organisasi_id', org)
    .gte('tanggal', dari).lte('tanggal', sampai);
  if (site) qKeg = qKeg.eq('site_id', site);
  if (basis) qKeg = qKeg.eq('basis_hasil', basis);
  const { data: kegiatans } = await qKeg;

  let qPeng = supabase
    .from('pengeluaran')
    .select('nilai, jenis, tanggal, kategori:kategori_biaya_id(kode,nama)')
    .eq('organisasi_id', org)
    .gte('tanggal', dari).lte('tanggal', sampai)
    .in('status', ['disetujui', 'dibayar', 'dibukukan']);
  const { data: pengeluarans } = await qPeng;

  const { data: loxTrx } = await supabase
    .from('transaksi_lox')
    .select('arah, jumlah_kg, jenis, created_at')
    .eq('organisasi_id', org)
    .gte('created_at', dari)
    .lte('created_at', sampai + 'T23:59:59');

  // ---- Query periode sebelumnya (untuk delta) ----
  let qKegPrev = supabase
    .from('kegiatan')
    .select('aktual_bcm, aktual_lubang, aktual_lox_kg')
    .eq('organisasi_id', org)
    .gte('tanggal', prev.dari).lte('tanggal', prev.sampai);
  if (site) qKegPrev = qKegPrev.eq('site_id', site);
  if (basis) qKegPrev = qKegPrev.eq('basis_hasil', basis);
  const { data: kegiatansPrev } = await qKegPrev;

  const { data: pengeluaransPrev } = await supabase
    .from('pengeluaran')
    .select('nilai')
    .eq('organisasi_id', org)
    .gte('tanggal', prev.dari).lte('tanggal', prev.sampai)
    .in('status', ['disetujui', 'dibayar', 'dibukukan']);

  // ---- Agregat ----
  const kegList = kegiatans ?? [];
  const pengList = pengeluarans ?? [];
  const loxList = loxTrx ?? [];

  const sum = (arr: any[], key: string) => arr.reduce((s, r) => s + Number(r[key] || 0), 0);

  const totalBCM = sum(kegList, 'aktual_bcm');
  const totalLubang = sum(kegList, 'aktual_lubang');
  const totalLox = loxList
    .filter((t: any) => t.jenis === 'pengeluaran_site')
    .reduce((s: number, t: any) => s + Number(t.jumlah_kg || 0), 0);
  const totalKegiatan = kegList.length;
  const totalBiaya = sum(pengList, 'nilai');

  const biayaPerBcm = totalBCM > 0 ? totalBiaya / totalBCM : 0;
  const biayaPerLubang = totalLubang > 0 ? totalBiaya / totalLubang : 0;
  const loxPerBcm = totalBCM > 0 ? totalLox / totalBCM : 0;
  const loxPerLubang = totalLubang > 0 ? totalLox / totalLubang : 0;

  // Prev aggregates
  const prevBCM = sum(kegiatansPrev ?? [], 'aktual_bcm');
  const prevLubang = sum(kegiatansPrev ?? [], 'aktual_lubang');
  const prevBiaya = sum(pengeluaransPrev ?? [], 'nilai');
  const prevKegiatan = (kegiatansPrev ?? []).length;

  function delta(curr: number, prevV: number) {
    if (prevV === 0) return curr > 0 ? { pct: 100 } : { pct: 0 };
    return { pct: ((curr - prevV) / prevV) * 100 };
  }

  // ---- Trend (bucket by day atau month) ----
  const bucketByMonth = periode === 'tahunan';
  const trendMap: Record<string, { kuantitas: number; biaya: number; biayaPerSatuan: number }> = {};

  kegList.forEach((k: any) => {
    const tgl = String(k.tanggal);
    const key = bucketByMonth ? tgl.slice(0, 7) : tgl;
    if (!trendMap[key]) trendMap[key] = { kuantitas: 0, biaya: 0, biayaPerSatuan: 0 };
    const qty = basis === 'per_lubang' ? Number(k.aktual_lubang) : Number(k.aktual_bcm);
    trendMap[key].kuantitas += qty;
  });

  pengList.forEach((p: any) => {
    const tgl = String(p.tanggal);
    const key = bucketByMonth ? tgl.slice(0, 7) : tgl;
    if (!trendMap[key]) trendMap[key] = { kuantitas: 0, biaya: 0, biayaPerSatuan: 0 };
    trendMap[key].biaya += Number(p.nilai || 0);
  });

  // Hitung biaya per satuan per bucket
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({
      label: bucketByMonth ? k.slice(2) : k.slice(5),
      kuantitas: v.kuantitas,
      biayaPerSatuan: v.kuantitas > 0 ? Math.round(v.biaya / v.kuantitas) : 0,
    }));

  // ---- Distribusi basis ----
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
  })).sort((a, b) => b.jumlah - a.jumlah);

  // ---- Top Site ----
  const siteMap: Record<string, { nama: string; bcm: number; lubang: number; biaya: number }> = {};
  kegList.forEach((k: any) => {
    const key = k.site?.kode ?? '—';
    if (!siteMap[key]) siteMap[key] = { nama: k.site?.nama ?? '—', bcm: 0, lubang: 0, biaya: 0 };
    siteMap[key].bcm += Number(k.aktual_bcm || 0);
    siteMap[key].lubang += Number(k.aktual_lubang || 0);
  });
  pengList.forEach((p: any) => { /* biaya sudah tidak punya site di sini — pakai agregat dari kegiatan */ });

  const siteRows = Object.entries(siteMap)
    .map(([kode, s]) => ({ kode, ...s }))
    .sort((a, b) => (basis === 'per_lubang' ? b.lubang - a.lubang : b.bcm - a.bcm));

  const topSite = siteRows.slice(0, 6).map((s) => ({
    label: s.kode,
    value: basis === 'per_lubang' ? s.lubang : s.bcm,
  }));

  // ---- Biaya per kategori ----
  const kategoriMap: Record<string, { nama: string; nilai: number; jumlah: number }> = {};
  pengList.forEach((p: any) => {
    const key = p.kategori?.kode ?? '—';
    if (!kategoriMap[key]) kategoriMap[key] = { nama: p.kategori?.nama ?? '—', nilai: 0, jumlah: 0 };
    kategoriMap[key].nilai += Number(p.nilai || 0);
    kategoriMap[key].jumlah += 1;
  });
  const kategoriRows = Object.values(kategoriMap).sort((a, b) => b.nilai - a.nilai);

  // ---- Top Kegiatan (biaya) ----
  const kegiatanWithBiaya = kegList.map((k: any) => {
    const biaya = pengList
      .filter((p: any) => p.kegiatan_id === k.id)
      .reduce((s: number, p: any) => s + Number(p.nilai || 0), 0);
    const qty = basis === 'per_lubang' ? Number(k.aktual_lubang) : Number(k.aktual_bcm);
    return { ...k, biaya, qty, biayaPerSatuan: qty > 0 ? biaya / qty : 0 };
  }).sort((a, b) => b.biaya - a.biaya).slice(0, 5);

  const labelSatuan = basis === 'per_lubang' ? 'Lubang' : basis === 'per_kegiatan' ? 'Kegiatan' : 'BCM';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analitik"
        subtitle="Performa operasional dan biaya dalam satu layar."
        actions={
          <Link href={`/api/laporan/analitik-kegiatan?dari=${dari}&sampai=${sampai}${site ? `&site=${site}` : ''}`}>
            <Button variant="secondary"><Download size={14} /> Export CSV</Button>
          </Link>
        }
      />

      <FilterBar
        sites={(sites ?? []) as any}
        nilaiAwal={{ periode, dari, sampai, site, basis }}
      />

      {/* KPI Row 1 — operasional */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPIStat
          label="Total BCM"
          value={totalBCM.toLocaleString('id-ID')}
          delta={delta(totalBCM, prevBCM)}
        />
        <KPIStat
          label="Total Lubang"
          value={totalLubang.toLocaleString('id-ID')}
          delta={delta(totalLubang, prevLubang)}
        />
        <KPIStat
          label="Total LOX"
          value={`${totalLox.toLocaleString('id-ID')} kg`}
          sub="Dari pengeluaran ke site"
        />
        <KPIStat
          label="Kegiatan"
          value={totalKegiatan.toLocaleString('id-ID')}
          delta={delta(totalKegiatan, prevKegiatan)}
        />
      </div>

      {/* KPI Row 2 — keuangan / efisiensi */}
      {bolehRinci ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPIStat
            label="Total Biaya"
            value={rupiah(totalBiaya)}
            delta={delta(totalBiaya, prevBiaya)}
            tone="orange"
          />
          <KPIStat
            label="Biaya / BCM"
            value={rupiah(biayaPerBcm)}
            tone="blue"
          />
          <KPIStat
            label="Biaya / Lubang"
            value={rupiah(biayaPerLubang)}
            tone="orange"
          />
          <KPIStat
            label="LOX / BCM"
            value={`${loxPerBcm.toFixed(3)} kg`}
            tone="green"
            sub="Efisiensi bahan peledak"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPIStat label="LOX / BCM" value={`${loxPerBcm.toFixed(3)} kg`} tone="green" />
          <KPIStat label="LOX / Lubang" value={`${loxPerLubang.toFixed(3)} kg`} tone="orange" />
          <KPIStat
            label={`Rata-rata ${labelSatuan} / Kegiatan`}
            value={totalKegiatan > 0 ? (totalBCM / totalKegiatan).toFixed(1) : '0'}
          />
          <KPIStat
            label="Total LOX"
            value={`${totalLox.toLocaleString('id-ID')} kg`}
          />
        </div>
      )}

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trend chart — 6 col */}
        <Card className="lg:col-span-6">
          <div className="px-5 py-4 border-b">
            <div className="text-[14px] font-semibold">Tren {labelSatuan} & Biaya per Satuan</div>
            <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
              Batang = {labelSatuan}, garis = biaya per {labelSatuan.toLowerCase()}
            </p>
          </div>
          <CardBody>
            {trendData.length === 0 ? (
              <div className="py-16 text-center text-[12px] text-[color:var(--text-3)]">
                Belum ada data tren
              </div>
            ) : (
              <TrendComboChart
                data={trendData}
                barLabel={labelSatuan}
                lineLabel={`Biaya / ${labelSatuan}`}
                showBiaya={bolehRinci}
              />
            )}
          </CardBody>
        </Card>

        {/* Donut — 3 col */}
        <Card className="lg:col-span-3">
          <div className="px-5 py-4 border-b">
            <div className="text-[14px] font-semibold">Distribusi Basis</div>
            <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
              Kegiatan menurut basis kontrak
            </p>
          </div>
          <CardBody>
            <DonutChart data={basisData} />
            <DonutLegend data={basisData} />
          </CardBody>
        </Card>

        {/* Ranked bar list — 3 col */}
        <Card className="lg:col-span-3">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold">
                {labelSatuan} per Site
              </div>
              <p className="text-[12px] text-[color:var(--text-2)] mt-0.5">
                Top 6 site
              </p>
            </div>
          </div>
          <CardBody>
            <RankedBarList data={topSite} />
          </CardBody>
        </Card>
      </div>

      {/* Bottom row — 3 tabel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankedTable
          judul="Performa per Site"
          link="/laporan/kegiatan"
          kolom={[
            { key: 'kode', label: 'Site', primary: true },
            { key: 'bcm', label: 'BCM', align: 'right', render: (r) => Number(r.bcm).toLocaleString('id-ID') },
            { key: 'lubang', label: 'Lubang', align: 'right', render: (r) => Number(r.lubang).toLocaleString('id-ID') },
          ]}
          rows={siteRows.slice(0, 6)}
        />

        <RankedTable
          judul="Biaya per Kategori"
          link="/laporan/biaya-kategori"
          kolom={[
            { key: 'nama', label: 'Kategori', primary: true },
            { key: 'jumlah', label: 'Jml', align: 'right' },
            { key: 'nilai', label: 'Total', align: 'right', render: (r) => bolehRinci ? rupiah(r.nilai) : '—' },
          ]}
          rows={kategoriRows.slice(0, 6)}
        />

        <RankedTable
          judul="Kegiatan Biaya Tertinggi"
          link="/biaya/pengeluaran"
          kolom={[
            { key: 'nomor', label: 'Kegiatan', primary: true, render: (r) => (
              <Link href={`/kegiatan/${r.id}`} className="text-blue hover:underline">
                {r.nomor}
              </Link>
            )},
            { key: 'qty', label: labelSatuan, align: 'right', render: (r) => Number(r.qty).toLocaleString('id-ID') },
            { key: 'biaya', label: 'Biaya', align: 'right', render: (r) => bolehRinci ? rupiah(r.biaya) : '—' },
          ]}
          rows={kegiatanWithBiaya}
        />
      </div>
    </div>
  );
}