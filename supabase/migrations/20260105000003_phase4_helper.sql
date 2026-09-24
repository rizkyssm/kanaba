-- =========================================================
-- Phase 4A — Helper & RPC
-- =========================================================

-- Hak akses baru
insert into public.hak_akses (kode, modul, deskripsi, sensitif) values
  ('pembelian.lihat',  'pembelian', 'Lihat pembelian', false),
  ('pembelian.kelola', 'pembelian', 'Kelola pembelian', true)
on conflict (kode) do nothing;

insert into public.peran_hak_akses (peran_id, hak_akses_kode)
select p.id, h.kode
from public.peran p
cross join (values ('pembelian.lihat'), ('pembelian.kelola')) as h(kode)
where p.kode in ('admin','operasional','keuangan')
on conflict do nothing;

-- Seed kategori biaya default untuk semua organisasi
insert into public.kategori_biaya (organisasi_id, kode, nama, jenis, klasifikasi)
select o.id, v.kode, v.nama, v.jenis, v.klasifikasi
from public.organisasi o
cross join (values
  ('LOX',        'Liquid Oxygen',        'langsung',      'opex'),
  ('MAT_KANABA', 'Material KANABA',      'langsung',      'opex'),
  ('UPAH',       'Upah Tenaga Lepas',    'langsung',      'opex'),
  ('RENTAL',     'Rental Kendaraan',     'langsung',      'opex'),
  ('BBM',        'BBM Kegiatan',         'langsung',      'opex'),
  ('MAKAN',      'Makan Kegiatan',       'langsung',      'opex'),
  ('HOTEL',      'Hotel Kegiatan',       'langsung',      'opex'),
  ('TOLL',       'Toll / Parkir',        'langsung',      'opex'),
  ('GAJI',       'Gaji Administrasi',    'tidak_langsung','opex'),
  ('SEWA_KTR',   'Sewa Kantor',          'tidak_langsung','opex'),
  ('INTERNET',   'Internet Kantor',      'tidak_langsung','opex'),
  ('UTILITAS',   'Listrik & Air',        'tidak_langsung','opex'),
  ('ADM',        'Biaya Administrasi',   'tidak_langsung','opex'),
  ('CAPEX_ASET', 'Pembelian Aset',       'tidak_langsung','capex')
) as v(kode, nama, jenis, klasifikasi)
on conflict do nothing;

-- RPC: approval pengeluaran (transisi status)
create or replace function public.transisi_status_pengeluaran(
  p_id uuid,
  p_status_baru text,
  p_catatan text default null
)
returns public.status_pengeluaran_keu
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_status public.status_pengeluaran_keu;
  v_user uuid := auth.uid();
  v_ns public.status_pengeluaran_keu := p_status_baru::public.status_pengeluaran_keu;
begin
  select organisasi_id, status into v_org, v_status
  from pengeluaran where id = p_id;

  if v_org is null then raise exception 'Pengeluaran tidak ditemukan'; end if;

  -- Validasi transisi
  if not (
    (v_status = 'draf' and v_ns = 'diajukan')
    or (v_status = 'diajukan' and v_ns in ('diverifikasi_operasional','ditolak'))
    or (v_status = 'diverifikasi_operasional' and v_ns in ('diverifikasi_keuangan','ditolak'))
    or (v_status = 'diverifikasi_keuangan' and v_ns in ('disetujui','ditolak'))
    or (v_status = 'disetujui' and v_ns = 'dibayar')
    or (v_status = 'dibayar' and v_ns = 'dibukukan')
    or (v_ns = 'dibatalkan' and v_status not in ('dibukukan','dibatalkan'))
  ) then
    raise exception 'Transisi tidak valid dari % ke %', v_status, v_ns;
  end if;

  update pengeluaran set
    status = v_ns,
    alasan_penolakan = case when v_ns = 'ditolak' then p_catatan else alasan_penolakan end,
    diajukan_at = case when v_ns = 'diajukan' then now() else diajukan_at end,
    diverifikasi_operasional_oleh = case when v_ns = 'diverifikasi_operasional' then v_user else diverifikasi_operasional_oleh end,
    diverifikasi_operasional_at = case when v_ns = 'diverifikasi_operasional' then now() else diverifikasi_operasional_at end,
    diverifikasi_keuangan_oleh = case when v_ns = 'diverifikasi_keuangan' then v_user else diverifikasi_keuangan_oleh end,
    diverifikasi_keuangan_at = case when v_ns = 'diverifikasi_keuangan' then now() else diverifikasi_keuangan_at end,
    disetujui_oleh = case when v_ns = 'disetujui' then v_user else disetujui_oleh end,
    disetujui_at = case when v_ns = 'disetujui' then now() else disetujui_at end,
    dibayar_oleh = case when v_ns = 'dibayar' then v_user else dibayar_oleh end,
    dibayar_at = case when v_ns = 'dibayar' then now() else dibayar_at end,
    dibukukan_oleh = case when v_ns = 'dibukukan' then v_user else dibukukan_oleh end,
    dibukukan_at = case when v_ns = 'dibukukan' then now() else dibukukan_at end
  where id = p_id;

  return v_ns;
end $$;