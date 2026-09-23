-- =========================================================
-- Phase 2A — Kegiatan, Personel, Aset, HSE
-- =========================================================

-- ===== KEGIATAN =====
create type public.status_kegiatan as enum (
  'draf','direncanakan','menunggu_persetujuan','disetujui','persiapan',
  'dikirim_ke_site','di_site','sedang_berjalan','selesai','rekonsiliasi',
  'ditutup','dibatalkan'
);

create table public.kegiatan (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid not null references public.site(id),
  nomor text not null,
  nama text not null,
  tanggal date not null default current_date,
  lokasi text,
  penanggung_jawab_id uuid references public.profil(id),
  target_bcm numeric(14,2) not null default 0,
  aktual_bcm numeric(14,2) not null default 0,
  rencana_kanaba integer not null default 0,
  aktual_kanaba integer not null default 0,
  rencana_lox_kg numeric(14,2) not null default 0,
  aktual_lox_kg numeric(14,2) not null default 0,
  status public.status_kegiatan not null default 'draf',
  catatan text,
  waktu_mulai timestamptz,
  waktu_selesai timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, nomor)
);
create index idx_kegiatan_org on public.kegiatan(organisasi_id);
create index idx_kegiatan_site on public.kegiatan(site_id);
create index idx_kegiatan_status on public.kegiatan(organisasi_id, status);
create index idx_kegiatan_tanggal on public.kegiatan(organisasi_id, tanggal desc);

create trigger trg_kegiatan_updated before update on public.kegiatan
  for each row execute function public.set_updated_at();

create table public.riwayat_status_kegiatan (
  id bigserial primary key,
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  status_lama public.status_kegiatan,
  status_baru public.status_kegiatan not null,
  oleh_id uuid references public.profil(id),
  catatan text,
  created_at timestamptz not null default now()
);
create index idx_riwayat_kegiatan on public.riwayat_status_kegiatan(kegiatan_id, created_at desc);

-- ===== PERSONEL =====
create type public.tipe_personel as enum ('karyawan','tenaga_lepas','vendor');

create table public.personel (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  tipe public.tipe_personel not null,
  nama text not null,
  telepon text,
  keahlian text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_personel_org on public.personel(organisasi_id, aktif);

create trigger trg_personel_updated before update on public.personel
  for each row execute function public.set_updated_at();

create table public.personel_kompensasi (
  personel_id uuid primary key references public.personel(id) on delete cascade,
  tarif numeric(14,2),
  jenis_tarif text check (jenis_tarif in ('per_hari','per_jam','per_kegiatan','per_hasil'))
);

create table public.personel_kegiatan (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  personel_id uuid not null references public.personel(id) on delete cascade,
  peran text,
  created_at timestamptz not null default now(),
  unique (kegiatan_id, personel_id)
);
create index idx_pk_kegiatan on public.personel_kegiatan(kegiatan_id);

-- ===== ASET =====
create type public.status_aset as enum (
  'aktif','digunakan','tersedia','dalam_perawatan','rusak','tidak_aktif','dihapus'
);

create table public.aset (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid references public.site(id),
  kode text not null,
  nama text not null,
  kategori text,
  nomor_seri text,
  status public.status_aset not null default 'aktif',
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);
create index idx_aset_org on public.aset(organisasi_id, status);

create trigger trg_aset_updated before update on public.aset
  for each row execute function public.set_updated_at();

create table public.aset_keuangan (
  aset_id uuid primary key references public.aset(id) on delete cascade,
  tanggal_pembelian date,
  harga_perolehan numeric(16,2),
  masa_manfaat_bulan int check (masa_manfaat_bulan is null or masa_manfaat_bulan > 0)
);

create table public.pemakaian_aset (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  aset_id uuid not null references public.aset(id) on delete cascade,
  mulai timestamptz,
  selesai timestamptz,
  catatan text,
  created_at timestamptz not null default now()
);
create index idx_pa_kegiatan on public.pemakaian_aset(kegiatan_id);

-- ===== HSE =====
create type public.status_hse as enum ('terbuka','ditindaklanjuti','selesai','ditutup');
create type public.jenis_hse as enum ('pemeriksaan','temuan','insiden','kondisi_tidak_aman','tindakan_perbaikan');
create type public.tingkat_risiko as enum ('rendah','sedang','tinggi','kritis');

create table public.catatan_hse (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kegiatan_id uuid references public.kegiatan(id) on delete set null,
  site_id uuid references public.site(id),
  jenis public.jenis_hse not null,
  judul text not null,
  deskripsi text,
  tingkat public.tingkat_risiko not null default 'rendah',
  status public.status_hse not null default 'terbuka',
  tindakan_perbaikan text,
  penanggung_jawab_id uuid references public.profil(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_hse_org on public.catatan_hse(organisasi_id, status);
create index idx_hse_kegiatan on public.catatan_hse(kegiatan_id);

create trigger trg_hse_updated before update on public.catatan_hse
  for each row execute function public.set_updated_at();