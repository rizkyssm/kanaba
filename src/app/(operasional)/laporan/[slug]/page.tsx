import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardBody } from '@/components/ui/Card';
import { TableWrap, THead, TH, TBody, TR, TD } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { cariLaporan } from '@/features/laporan/daftar';
import FilterLaporan from '@/features/laporan/FilterLaporan';
import { Download, FileText } from 'lucide-react';

type Params = Promise<{ slug: string }>;
type Search = Promise<{ dari?: string; sampai?: string; site?: string }>;

export default async function LaporanDetailPage({
  params, searchParams,
}: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const sp = await searchParams;

  const ctx = await getKonteks();
  if (!ctx) return null;

  const lap = cariLaporan(slug);
  if (!lap) notFound();
  if (!punya(ctx, lap.hak)) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Laporan', href: '/laporan' }, { label: lap.nama }]} />
        <PageHeader title={lap.nama} />
        <Card><EmptyState title="Akses terbatas"
          description="Anda tidak memiliki hak untuk melihat laporan ini." /></Card>
      </div>
    );
  }

  const dari = sp.dari ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const sampai = sp.sampai ?? new Date().toISOString().slice(0, 10);
  const site = sp.site ?? '';

  const supabase = await createClient();
  const { data: sites } = await supabase.from('site')
    .select('id, kode, nama').eq('organisasi_id', ctx.organisasiId).eq('aktif', true).order('nama');

  // Query per laporan — simple preview (top 100)
  let rows: any[] = [];
  let kolom: { key: string; label: string; align?: 'right' }[] = [];
  const org = ctx.organisasiId;

  if (slug === 'stok-material') {
    let q = supabase.from('v_saldo_persediaan')
      .select('saldo, material:material_id(kode,nama), site:site_id(kode,nama)')
      .eq('organisasi_id', org);
    if (site) q = q.eq('site_id', site);
    const { data } = await q.limit(100);
    rows = (data ?? []).map((r: any) => ({
      kode: r.material?.kode, material: r.material?.nama,
      site: r.site?.kode, saldo: Number(r.saldo).toLocaleString('id-ID'),
    }));
    kolom = [
      { key: 'kode', label: 'Kode' },
      { key: 'material', label: 'Material' },
      { key: 'site', label: 'Site' },
      { key: 'saldo', label: 'Saldo', align: 'right' },
    ];
  } else if (slug === 'kegiatan') {
    let q = supabase.from('kegiatan')
      .select('nomor, tanggal, nama, basis_hasil, status, aktual_bcm, aktual_lubang, aktual_lox_kg, site:site_id(kode)')
      .eq('organisasi_id', org)
      .gte('tanggal', dari).lte('tanggal', sampai)
      .order('tanggal', { ascending: false });
    if (site) q = q.eq('site_id', site);
    const { data } = await q.limit(100);
    rows = (data ?? []).map((r: any) => ({
      nomor: r.nomor, tanggal: r.tanggal, nama: r.nama,
      basis: r.basis_hasil, status: r.status, site: r.site?.kode,
      bcm: Number(r.aktual_bcm).toLocaleString('id-ID'),
      lubang: Number(r.aktual_lubang).toLocaleString('id-ID'),
      lox: `${Number(r.aktual_lox_kg).toLocaleString('id-ID')} kg`,
    }));
    kolom = [
      { key: 'nomor', label: 'Nomor' },
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'nama', label: 'Nama' },
      { key: 'basis', label: 'Basis' },
      { key: 'site', label: 'Site' },
      { key: 'bcm', label: 'BCM', align: 'right' },
      { key: 'lubang', label: 'Lubang', align: 'right' },
      { key: 'lox', label: 'LOX', align: 'right' },
      { key: 'status', label: 'Status' },
    ];
  } else if (slug === 'pengeluaran') {
    let q = supabase.from('pengeluaran')
      .select('nomor, tanggal, nilai, status, kategori:kategori_biaya_id(kode,nama), vendor:vendor_id(nama)')
      .eq('organisasi_id', org)
      .gte('tanggal', dari).lte('tanggal', sampai)
      .order('tanggal', { ascending: false });
    const { data } = await q.limit(100);
    rows = (data ?? []).map((r: any) => ({
      nomor: r.nomor, tanggal: r.tanggal,
      kategori: r.kategori?.kode, vendor: r.vendor?.nama ?? '—',
      nilai: Number(r.nilai).toLocaleString('id-ID'), status: r.status,
    }));
    kolom = [
      { key: 'nomor', label: 'Nomor' },
      { key: 'tanggal', label: 'Tanggal' },
      { key: 'kategori', label: 'Kategori' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'nilai', label: 'Nilai', align: 'right' },
      { key: 'status', label: 'Status' },
    ];
  } else {
    // Untuk slug lain, tampilkan pesan
    rows = [];
    kolom = [];
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Laporan', href: '/laporan' },
        { label: lap.nama },
      ]} />
      <PageHeader
        title={lap.nama}
        subtitle={lap.deskripsi}
        actions={
          <Link href={`/api/laporan/${slug}?dari=${dari}&sampai=${sampai}${site ? `&site=${site}` : ''}`}>
            <Button variant="primary"><Download size={14} /> Export CSV</Button>
          </Link>
        }
      />

      <FilterLaporan
        sites={(sites ?? []) as any}
        nilaiAwal={{ dari, sampai, site }}
        basePath={`/laporan/${slug}`}
      />

      {kolom.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={20} />}
            title="Preview belum tersedia"
            description="Silakan gunakan tombol Export CSV untuk mengunduh data lengkap."
          />
        </Card>
      ) : rows.length === 0 ? (
        <Card><EmptyState title="Tidak ada data pada periode ini" /></Card>
      ) : (
        <TableWrap className="bg-[color:var(--bg-elev)]">
          <THead>
            {kolom.map((k) => <TH key={k.key} align={k.align}>{k.label}</TH>)}
          </THead>
          <TBody>
            {rows.map((r, i) => (
              <TR key={i}>
                {kolom.map((k) => (
                  <TD key={k.key} align={k.align as any}>{r[k.key]}</TD>
                ))}
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}