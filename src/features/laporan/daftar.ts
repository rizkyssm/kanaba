export type Laporan = {
  slug: string;
  nama: string;
  deskripsi: string;
  kategori: 'operasional' | 'keuangan';
  hak: string;
};

export const DAFTAR_LAPORAN: Laporan[] = [
  // Operasional
  { slug: 'stok-material',         nama: 'Laporan Stok Material',        deskripsi: 'Saldo material per site saat ini.',           kategori: 'operasional', hak: 'persediaan.lihat_jumlah' },
  { slug: 'pergerakan-material',   nama: 'Laporan Pergerakan Material',  deskripsi: 'Semua transaksi persediaan pada periode.',    kategori: 'operasional', hak: 'persediaan.lihat_jumlah' },
  { slug: 'produksi',              nama: 'Laporan Produksi',             deskripsi: 'Catatan produksi KANABA per periode.',        kategori: 'operasional', hak: 'produksi.lihat' },
  { slug: 'lox',                   nama: 'Laporan Liquid Oxygen',        deskripsi: 'Transaksi LOX masuk, keluar, dan pemakaian.', kategori: 'operasional', hak: 'persediaan.lihat_jumlah' },
  { slug: 'kegiatan',              nama: 'Laporan Kegiatan',             deskripsi: 'Daftar kegiatan beserta hasil aktual.',       kategori: 'operasional', hak: 'kegiatan.lihat' },
  { slug: 'hse',                   nama: 'Laporan HSE',                  deskripsi: 'Catatan HSE dan status tindak lanjut.',       kategori: 'operasional', hak: 'kegiatan.lihat' },
  // Keuangan
  { slug: 'biaya-kegiatan',        nama: 'Laporan Biaya Kegiatan',       deskripsi: 'Total biaya dan biaya per satuan hasil.',     kategori: 'keuangan', hak: 'biaya.lihat_rinci' },
  { slug: 'pengeluaran',           nama: 'Laporan Pengeluaran',          deskripsi: 'Semua dokumen pengeluaran pada periode.',     kategori: 'keuangan', hak: 'biaya.lihat_rinci' },
  { slug: 'biaya-kategori',        nama: 'Laporan Biaya per Kategori',   deskripsi: 'Agregat biaya per kategori.',                 kategori: 'keuangan', hak: 'biaya.lihat_rinci' },
  { slug: 'analitik-kegiatan',     nama: 'Analitik Kegiatan',            deskripsi: 'Data mentah analitik kegiatan (BCM, lubang, LOX).', kategori: 'keuangan', hak: 'kegiatan.lihat' },
];

export function cariLaporan(slug: string) {
  return DAFTAR_LAPORAN.find((l) => l.slug === slug);
}