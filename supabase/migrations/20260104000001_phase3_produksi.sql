-- =========================================================
-- Phase 3 — Produksi (idempoten)
-- =========================================================

do $$ begin
  create type public.status_produksi as enum ('draf','selesai','dibatalkan');
exception when duplicate_object then null; end $$;

create table if not exists public.produksi (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid references public.site(id),
  nomor text not null,
  produk_id uuid not null references public.produk(id),
  bom_id uuid references public.bom(id),
  tanggal date not null default current_date,
  jumlah_produksi numeric(16,4) not null check (jumlah_produksi > 0),
  hasil_baik numeric(16,4) not null default 0,
  status public.status_produksi not null default 'draf',
  catatan text,
  penanggung_jawab_id uuid references public.profil(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, nomor)
);
create index if not exists idx_produksi_org on public.produksi(organisasi_id, tanggal desc);
create index if not exists idx_produksi_produk on public.produksi(produk_id);

drop trigger if exists trg_produksi_updated on public.produksi;
create trigger trg_produksi_updated before update on public.produksi
  for each row execute function public.set_updated_at();

create table if not exists public.pemakaian_material_produksi (
  id uuid primary key default gen_random_uuid(),
  produksi_id uuid not null references public.produksi(id) on delete cascade,
  material_id uuid not null references public.material(id),
  jumlah numeric(16,4) not null check (jumlah > 0),
  catatan text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pmp_produksi on public.pemakaian_material_produksi(produksi_id);

create table if not exists public.alasan_penyesuaian (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);