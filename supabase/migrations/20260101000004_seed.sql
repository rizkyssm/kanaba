-- ---------- HAK AKSES ----------
insert into public.hak_akses (kode, modul, deskripsi, sensitif) values
  ('data_induk.lihat',    'data_induk', 'Lihat data induk', false),
  ('data_induk.kelola',   'data_induk', 'Kelola data induk', false),
  ('persediaan.lihat_jumlah','persediaan','Lihat kuantitas persediaan',false),
  ('persediaan.lihat_nilai','persediaan','Lihat nilai persediaan',true),
  ('persediaan.kelola',   'persediaan', 'Kelola persediaan', false),
  ('kegiatan.lihat',      'kegiatan',   'Lihat kegiatan', false),
  ('kegiatan.kelola',     'kegiatan',   'Kelola kegiatan', false),
  ('biaya.lihat_ringkasan','biaya',     'Lihat ringkasan biaya', true),
  ('biaya.lihat_rinci',   'biaya',      'Lihat rincian biaya', true),
  ('biaya.kelola',        'biaya',      'Kelola biaya', true),
  ('gaji.lihat',          'gaji',       'Lihat gaji', true),
  ('gaji.kelola',         'gaji',       'Kelola gaji', true),
  ('laporan.operasional', 'laporan',    'Laporan operasional', false),
  ('laporan.keuangan',    'laporan',    'Laporan keuangan', true),
  ('pengguna.kelola',     'pengguna',   'Kelola pengguna & peran', false),
  ('organisasi.kelola',   'organisasi', 'Kelola organisasi', false),
  ('log.lihat',           'log',        'Lihat log aktivitas', false)
on conflict (kode) do nothing;