import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKonteks, punya } from '@/lib/auth/permissions';
import { cariLaporan } from '@/features/laporan/daftar';

function csvEscape(v: any): string {
  if (v == null) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, any>[], kolom: { key: string; label: string }[]): string {
  const header = kolom.map((k) => csvEscape(k.label)).join(',');
  const lines = rows.map((r) => kolom.map((k) => csvEscape(r[k.key])).join(','));
  return '\ufeff' + [header, ...lines].join('\n');
}

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const ctx = await getKonteks();
  if (!ctx) return new NextResponse('Unauthorized', { status: 401 });

  const lap = cariLaporan(slug);
  if (!lap) return new NextResponse('Laporan tidak ditemukan', { status: 404 });
  if (!punya(ctx, lap.hak)) return new NextResponse('Tidak berhak', { status: 403 });

  const url = new URL(req.url);
  const dari = url.searchParams.get('dari') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const sampai = url.searchParams.get('sampai') ?? new Date().toISOString().slice(0, 10);
  const site = url.searchParams.get('site') ?? '';

  const supabase = await createClient();
  const org = ctx.organisasiId;

  let rows: any[] = [];
  let kolom: { key: string; label: string }[] = [];

  switch (slug) {
    case 'stok-material': {
      let q = supabase.from('v_saldo_persediaan')
        .select('saldo, material:material_id(kode,nama), site:site_id(kode,nama)')
        .eq('organisasi_id', org);
      if (site) q = q.eq('site_id', site);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        kode: r.material?.kode, material: r.material?.nama,
        site: r.site?.kode, saldo: Number(r.saldo),
      }));
      kolom = [
        { key: 'kode', label: 'Kode' },
        { key: 'material', label: 'Material' },
        { key: 'site', label: 'Site' },
        { key: 'saldo', label: 'Saldo' },
      ];
      break;
    }
    case 'pergerakan-material': {
      let q = supabase.from('transaksi_persediaan')
        .select('created_at, jenis, arah, jumlah, catatan, material:material_id(kode,nama), site:site_id(kode)')
        .eq('organisasi_id', org)
        .gte('created_at', dari)
        .lte('created_at', sampai + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (site) q = q.eq('site_id', site);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        tanggal: new Date(r.created_at).toLocaleString('id-ID'),
        kode: r.material?.kode, material: r.material?.nama,
        site: r.site?.kode, jenis: r.jenis, arah: r.arah,
        jumlah: Number(r.jumlah), catatan: r.catatan ?? '',
      }));
      kolom = [
        { key: 'tanggal', label: 'Waktu' },
        { key: 'kode', label: 'Kode' },
        { key: 'material', label: 'Material' },
        { key: 'site', label: 'Site' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'arah', label: 'Arah' },
        { key: 'jumlah', label: 'Jumlah' },
        { key: 'catatan', label: 'Catatan' },
      ];
      break;
    }
    case 'produksi': {
      let q = supabase.from('produksi')
        .select('nomor, tanggal, jumlah_produksi, hasil_baik, status, produk:produk_id(kode,nama), site:site_id(kode)')
        .eq('organisasi_id', org)
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false });
      if (site) q = q.eq('site_id', site);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        nomor: r.nomor, tanggal: r.tanggal,
        produk: r.produk?.kode, nama_produk: r.produk?.nama,
        site: r.site?.kode,
        jumlah: Number(r.jumlah_produksi), hasil_baik: Number(r.hasil_baik),
        status: r.status,
      }));
      kolom = [
        { key: 'nomor', label: 'Nomor' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'produk', label: 'Kode Produk' },
        { key: 'nama_produk', label: 'Produk' },
        { key: 'site', label: 'Site' },
        { key: 'jumlah', label: 'Jumlah Produksi' },
        { key: 'hasil_baik', label: 'Hasil Baik' },
        { key: 'status', label: 'Status' },
      ];
      break;
    }
    case 'lox': {
      let q = supabase.from('transaksi_lox')
        .select('created_at, jenis, arah, jumlah_kg, catatan, kegiatan:kegiatan_id(nomor), site:site_id(kode)')
        .eq('organisasi_id', org)
        .gte('created_at', dari)
        .lte('created_at', sampai + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (site) q = q.eq('site_id', site);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        tanggal: new Date(r.created_at).toLocaleString('id-ID'),
        jenis: r.jenis, arah: r.arah, jumlah: Number(r.jumlah_kg),
        kegiatan: r.kegiatan?.nomor ?? '', site: r.site?.kode ?? '',
        catatan: r.catatan ?? '',
      }));
      kolom = [
        { key: 'tanggal', label: 'Waktu' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'arah', label: 'Arah' },
        { key: 'jumlah', label: 'Jumlah (kg)' },
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'site', label: 'Site' },
        { key: 'catatan', label: 'Catatan' },
      ];
      break;
    }
    case 'kegiatan': {
      let q = supabase.from('kegiatan')
        .select('nomor, tanggal, nama, basis_hasil, status, target_bcm, aktual_bcm, target_lubang, aktual_lubang, aktual_lox_kg, site:site_id(kode)')
        .eq('organisasi_id', org)
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false });
      if (site) q = q.eq('site_id', site);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        nomor: r.nomor, tanggal: r.tanggal, nama: r.nama,
        basis: r.basis_hasil, status: r.status, site: r.site?.kode,
        target_bcm: Number(r.target_bcm), aktual_bcm: Number(r.aktual_bcm),
        target_lubang: Number(r.target_lubang), aktual_lubang: Number(r.aktual_lubang),
        aktual_lox_kg: Number(r.aktual_lox_kg),
      }));
      kolom = [
        { key: 'nomor', label: 'Nomor' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'nama', label: 'Nama' },
        { key: 'basis', label: 'Basis' },
        { key: 'status', label: 'Status' },
        { key: 'site', label: 'Site' },
        { key: 'target_bcm', label: 'Target BCM' },
        { key: 'aktual_bcm', label: 'Aktual BCM' },
        { key: 'target_lubang', label: 'Target Lubang' },
        { key: 'aktual_lubang', label: 'Aktual Lubang' },
        { key: 'aktual_lox_kg', label: 'LOX (kg)' },
      ];
      break;
    }
    case 'hse': {
      const { data } = await supabase.from('catatan_hse')
        .select('created_at, jenis, judul, tingkat, status, kegiatan:kegiatan_id(nomor)')
        .eq('organisasi_id', org)
        .gte('created_at', dari).lte('created_at', sampai + 'T23:59:59')
        .order('created_at', { ascending: false });
      rows = (data ?? []).map((r: any) => ({
        tanggal: new Date(r.created_at).toLocaleString('id-ID'),
        jenis: r.jenis, judul: r.judul, tingkat: r.tingkat,
        status: r.status, kegiatan: r.kegiatan?.nomor ?? '',
      }));
      kolom = [
        { key: 'tanggal', label: 'Waktu' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'judul', label: 'Judul' },
        { key: 'tingkat', label: 'Tingkat' },
        { key: 'status', label: 'Status' },
        { key: 'kegiatan', label: 'Kegiatan' },
      ];
      break;
    }
    case 'biaya-kegiatan': {
      let q = supabase.from('v_biaya_per_hasil')
        .select('nomor, nama, basis_hasil, satuan_hasil, aktual_bcm, aktual_lubang, total_lox_kg, biaya_langsung, biaya_tidak_langsung, total_biaya, biaya_per_unit, lox_per_unit')
        .eq('organisasi_id', org);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        nomor: r.nomor, nama: r.nama, basis: r.basis_hasil,
        aktual_bcm: Number(r.aktual_bcm), aktual_lubang: Number(r.aktual_lubang),
        total_lox_kg: Number(r.total_lox_kg),
        biaya_langsung: Number(r.biaya_langsung),
        biaya_tidak_langsung: Number(r.biaya_tidak_langsung),
        total_biaya: Number(r.total_biaya),
        biaya_per_unit: Number(r.biaya_per_unit),
        satuan: r.satuan_hasil,
        lox_per_unit: Number(r.lox_per_unit),
      }));
      kolom = [
        { key: 'nomor', label: 'Nomor' },
        { key: 'nama', label: 'Nama' },
        { key: 'basis', label: 'Basis' },
        { key: 'aktual_bcm', label: 'Aktual BCM' },
        { key: 'aktual_lubang', label: 'Aktual Lubang' },
        { key: 'total_lox_kg', label: 'LOX (kg)' },
        { key: 'biaya_langsung', label: 'Biaya Langsung' },
        { key: 'biaya_tidak_langsung', label: 'Biaya Tidak Langsung' },
        { key: 'total_biaya', label: 'Total Biaya' },
        { key: 'biaya_per_unit', label: 'Biaya per Satuan' },
        { key: 'satuan', label: 'Satuan' },
        { key: 'lox_per_unit', label: 'LOX per Satuan' },
      ];
      break;
    }
    case 'pengeluaran': {
      let q = supabase.from('pengeluaran')
        .select('nomor, tanggal, nilai, jenis, klasifikasi, status, cara_pembayaran, catatan, kategori:kategori_biaya_id(kode,nama), vendor:vendor_id(nama), kegiatan:kegiatan_id(nomor)')
        .eq('organisasi_id', org)
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false });
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        nomor: r.nomor, tanggal: r.tanggal,
        kategori: r.kategori?.kode, nama_kategori: r.kategori?.nama,
        vendor: r.vendor?.nama ?? '',
        kegiatan: r.kegiatan?.nomor ?? '',
        jenis: r.jenis, klasifikasi: r.klasifikasi,
        pembayaran: r.cara_pembayaran,
        nilai: Number(r.nilai), status: r.status,
        catatan: r.catatan ?? '',
      }));
      kolom = [
        { key: 'nomor', label: 'Nomor' },
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'kategori', label: 'Kode Kategori' },
        { key: 'nama_kategori', label: 'Kategori' },
        { key: 'vendor', label: 'Vendor' },
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'klasifikasi', label: 'Klasifikasi' },
        { key: 'pembayaran', label: 'Pembayaran' },
        { key: 'nilai', label: 'Nilai' },
        { key: 'status', label: 'Status' },
        { key: 'catatan', label: 'Catatan' },
      ];
      break;
    }
    case 'biaya-kategori': {
      const { data } = await supabase.from('pengeluaran')
        .select('nilai, kategori:kategori_biaya_id(kode,nama,jenis,klasifikasi)')
        .eq('organisasi_id', org)
        .gte('tanggal', dari).lte('tanggal', sampai)
        .in('status', ['disetujui', 'dibayar', 'dibukukan']);
      const map: Record<string, any> = {};
      (data ?? []).forEach((r: any) => {
        const k = r.kategori?.kode ?? 'LAIN';
        if (!map[k]) {
          map[k] = {
            kode: k, nama: r.kategori?.nama ?? '—',
            jenis: r.kategori?.jenis ?? '—',
            klasifikasi: r.kategori?.klasifikasi ?? '—',
            total: 0, jumlah: 0,
          };
        }
        map[k].total += Number(r.nilai || 0);
        map[k].jumlah += 1;
      });
      rows = Object.values(map).sort((a: any, b: any) => b.total - a.total);
      kolom = [
        { key: 'kode', label: 'Kode' },
        { key: 'nama', label: 'Kategori' },
        { key: 'jenis', label: 'Jenis' },
        { key: 'klasifikasi', label: 'Klasifikasi' },
        { key: 'jumlah', label: 'Jumlah Transaksi' },
        { key: 'total', label: 'Total' },
      ];
      break;
    }
    case 'analitik-kegiatan': {
      let q = supabase.from('kegiatan')
        .select('nomor, nama, basis_hasil, tanggal, aktual_bcm, aktual_lubang, aktual_lox_kg, site:site_id(kode,nama)')
        .eq('organisasi_id', org)
        .gte('tanggal', dari).lte('tanggal', sampai)
        .order('tanggal', { ascending: false });
      if (site) q = q.eq('site_id', site);
      const { data } = await q;
      rows = (data ?? []).map((r: any) => ({
        tanggal: r.tanggal, nomor: r.nomor, nama: r.nama,
        basis: r.basis_hasil,
        site: r.site?.kode ?? '', nama_site: r.site?.nama ?? '',
        bcm: Number(r.aktual_bcm), lubang: Number(r.aktual_lubang),
        lox_kg: Number(r.aktual_lox_kg),
      }));
      kolom = [
        { key: 'tanggal', label: 'Tanggal' },
        { key: 'nomor', label: 'Nomor' },
        { key: 'nama', label: 'Nama' },
        { key: 'basis', label: 'Basis' },
        { key: 'site', label: 'Site' },
        { key: 'nama_site', label: 'Nama Site' },
        { key: 'bcm', label: 'BCM' },
        { key: 'lubang', label: 'Lubang' },
        { key: 'lox_kg', label: 'LOX (kg)' },
      ];
      break;
    }
    default:
      return new NextResponse('Laporan belum diimplementasikan', { status: 501 });
  }

  const csv = toCsv(rows, kolom);
  const namaFile = `${slug}_${dari}_${sampai}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${namaFile}"`,
    },
  });
}