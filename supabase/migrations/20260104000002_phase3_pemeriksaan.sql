-- =========================================================
-- Phase 3 — Pemeriksaan Fisik (idempoten)
-- =========================================================

do $$ begin
  create type public.status_pemeriksaan_fisik as enum (
    'draf','diajukan','disetujui_supervisor','disetujui','ditolak','dibatalkan'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.pemeriksaan_fisik (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid not null references public.site(id),
  nomor text not null,
  tanggal date not null default current_date,
  status public.status_pemeriksaan_fisik not null default 'draf',
  catatan text,
  diajukan_oleh uuid references public.profil(id),
  diajukan_at timestamptz,
  disetujui_supervisor_oleh uuid references public.profil(id),
  disetujui_supervisor_at timestamptz,
  disetujui_oleh uuid references public.profil(id),
  disetujui_at timestamptz,
  alasan_penolakan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, nomor)
);
create index if not exists idx_pf_org on public.pemeriksaan_fisik(organisasi_id, tanggal desc);
create index if not exists idx_pf_status on public.pemeriksaan_fisik(organisasi_id, status);

drop trigger if exists trg_pf_updated on public.pemeriksaan_fisik;
create trigger trg_pf_updated before update on public.pemeriksaan_fisik
  for each row execute function public.set_updated_at();

create table if not exists public.pemeriksaan_fisik_item (
  id uuid primary key default gen_random_uuid(),
  pemeriksaan_id uuid not null references public.pemeriksaan_fisik(id) on delete cascade,
  material_id uuid not null references public.material(id),
  stok_sistem numeric(16,4) not null,
  jumlah_fisik numeric(16,4) not null check (jumlah_fisik >= 0),
  selisih numeric(16,4) not null,
  alasan_kode text,
  catatan text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pfi_pemeriksaan on public.pemeriksaan_fisik_item(pemeriksaan_id);