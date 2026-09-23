-- =========================================================
-- Phase 2B — Ledger Persediaan & Liquid Oxygen
-- =========================================================

create type public.arah_transaksi as enum ('masuk','keluar');
create type public.jenis_transaksi_persediaan as enum (
  'saldo_awal','penerimaan_pembelian','hasil_produksi','pemakaian_produksi',
  'pengeluaran_site','pengembalian_site','mutasi_masuk','mutasi_keluar',
  'penyesuaian_positif','penyesuaian_negatif','barang_rusak','barang_hilang','penghapusan'
);

create table public.transaksi_persediaan (
  id bigserial primary key,
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid references public.site(id),
  material_id uuid not null references public.material(id),
  jenis public.jenis_transaksi_persediaan not null,
  arah public.arah_transaksi not null,
  jumlah numeric(16,4) not null check (jumlah > 0),
  referensi_tipe text,
  referensi_id uuid,
  kegiatan_id uuid references public.kegiatan(id) on delete set null,
  catatan text,
  dibuat_oleh uuid references public.profil(id),
  created_at timestamptz not null default now()
);
create index idx_tp_org on public.transaksi_persediaan(organisasi_id, created_at desc);
create index idx_tp_material on public.transaksi_persediaan(material_id, site_id);
create index idx_tp_kegiatan on public.transaksi_persediaan(kegiatan_id);

create view public.v_saldo_persediaan
with (security_invoker = true)
as
select
  tp.organisasi_id,
  tp.site_id,
  tp.material_id,
  sum(case when tp.arah = 'masuk' then tp.jumlah else -tp.jumlah end)::numeric(16,4) as saldo
from public.transaksi_persediaan tp
group by tp.organisasi_id, tp.site_id, tp.material_id;

-- ===== PENGELUARAN MATERIAL =====
create type public.status_pengeluaran as enum (
  'draf','dikirim','dikembalikan_sebagian','dikembalikan_penuh','dibatalkan'
);

create table public.pengeluaran_material (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  site_id uuid not null references public.site(id),
  nomor text not null,
  tanggal date not null default current_date,
  status public.status_pengeluaran not null default 'draf',
  catatan text,
  dibuat_oleh uuid references public.profil(id),
  created_at timestamptz not null default now(),
  unique (organisasi_id, nomor)
);
create index idx_pm_kegiatan on public.pengeluaran_material(kegiatan_id);

create table public.pengeluaran_material_item (
  id uuid primary key default gen_random_uuid(),
  pengeluaran_id uuid not null references public.pengeluaran_material(id) on delete cascade,
  material_id uuid not null references public.material(id),
  jumlah numeric(16,4) not null check (jumlah > 0),
  catatan text
);
create index idx_pmi_pengeluaran on public.pengeluaran_material_item(pengeluaran_id);

create table public.pengembalian_material (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kegiatan_id uuid not null references public.kegiatan(id) on delete cascade,
  site_id uuid not null references public.site(id),
  nomor text not null,
  tanggal date not null default current_date,
  catatan text,
  dibuat_oleh uuid references public.profil(id),
  created_at timestamptz not null default now(),
  unique (organisasi_id, nomor)
);
create index idx_pkm_kegiatan on public.pengembalian_material(kegiatan_id);

create table public.pengembalian_material_item (
  id uuid primary key default gen_random_uuid(),
  pengembalian_id uuid not null references public.pengembalian_material(id) on delete cascade,
  material_id uuid not null references public.material(id),
  jumlah numeric(16,4) not null check (jumlah > 0),
  catatan text
);

-- ===== LIQUID OXYGEN =====
create type public.jenis_transaksi_lox as enum (
  'penerimaan','pengeluaran_site','pengembalian_site','pemakaian',
  'penyesuaian_positif','penyesuaian_negatif'
);

create table public.transaksi_lox (
  id bigserial primary key,
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid references public.site(id),
  kegiatan_id uuid references public.kegiatan(id) on delete set null,
  jenis public.jenis_transaksi_lox not null,
  arah public.arah_transaksi not null,
  jumlah_kg numeric(14,2) not null check (jumlah_kg > 0),
  catatan text,
  dibuat_oleh uuid references public.profil(id),
  created_at timestamptz not null default now()
);
create index idx_lox_org on public.transaksi_lox(organisasi_id, created_at desc);
create index idx_lox_kegiatan on public.transaksi_lox(kegiatan_id);

create view public.v_saldo_lox
with (security_invoker = true)
as
select
  tl.organisasi_id,
  tl.site_id,
  sum(case when tl.arah = 'masuk' then tl.jumlah_kg else -tl.jumlah_kg end)::numeric(14,2) as saldo_kg
from public.transaksi_lox tl
group by tl.organisasi_id, tl.site_id;