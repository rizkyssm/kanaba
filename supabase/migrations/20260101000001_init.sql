-- =========================================================
-- KANABA SaaS — Skema Awal
-- =========================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- PROFIL (extend auth.users) ----------
create table public.profil (
  id uuid primary key references auth.users(id) on delete cascade,
  nama_lengkap text not null default '',
  email text not null,
  avatar_url text,
  telepon text,
  aktif boolean not null default true,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profil_email on public.profil(email);

-- ---------- ORGANISASI ----------
create table public.organisasi (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  slug text not null unique,
  alamat text,
  telepon text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ANGGOTA ORGANISASI ----------
create type public.status_anggota as enum ('aktif','ditangguhkan','keluar');

create table public.anggota_organisasi (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  profil_id uuid not null references public.profil(id) on delete cascade,
  status public.status_anggota not null default 'aktif',
  created_at timestamptz not null default now(),
  unique(organisasi_id, profil_id)
);
create index idx_anggota_org on public.anggota_organisasi(organisasi_id);
create index idx_anggota_profil on public.anggota_organisasi(profil_id);

-- ---------- PERAN ----------
create table public.peran (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,           -- contoh: staf_lapangan, supervisor, gudang, operasional, keuangan, manajer, admin
  nama text not null,
  deskripsi text,
  bawaan boolean not null default false,   -- true jika peran sistem
  created_at timestamptz not null default now(),
  unique(organisasi_id, kode)
);

-- ---------- HAK AKSES ----------
create table public.hak_akses (
  kode text primary key,        -- contoh: persediaan.lihat_jumlah
  modul text not null,
  deskripsi text,
  sensitif boolean not null default false
);

-- ---------- PERAN × HAK AKSES ----------
create table public.peran_hak_akses (
  peran_id uuid not null references public.peran(id) on delete cascade,
  hak_akses_kode text not null references public.hak_akses(kode) on delete cascade,
  primary key (peran_id, hak_akses_kode)
);

-- ---------- ANGGOTA × PERAN ----------
create table public.anggota_peran (
  anggota_id uuid not null references public.anggota_organisasi(id) on delete cascade,
  peran_id uuid not null references public.peran(id) on delete cascade,
  primary key (anggota_id, peran_id)
);

-- ---------- SITE ----------
create table public.site (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  alamat text,
  lintang numeric(10,7),
  bujur numeric(10,7),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organisasi_id, kode)
);
create index idx_site_org on public.site(organisasi_id);

-- ---------- SATUAN ----------
create table public.satuan (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,          -- pcs, kg, liter, m, bcm
  nama text not null,
  unique(organisasi_id, kode)
);

-- ---------- KATEGORI MATERIAL ----------
create table public.kategori_material (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  unique(organisasi_id, kode)
);

-- ---------- MATERIAL ----------
create table public.material (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  kategori_id uuid references public.kategori_material(id) on delete set null,
  satuan_id uuid references public.satuan(id) on delete set null,
  deskripsi text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organisasi_id, kode)
);
create index idx_material_org on public.material(organisasi_id);

-- ---------- LOG AKTIVITAS ----------
create table public.log_aktivitas (
  id bigserial primary key,
  organisasi_id uuid references public.organisasi(id) on delete cascade,
  profil_id uuid references public.profil(id) on delete set null,
  aksi text not null,              -- login, logout, buat_site, ubah_site, dst
  entitas text,                    -- nama tabel
  entitas_id uuid,
  nilai_sebelum jsonb,
  nilai_sesudah jsonb,
  ip text,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);
create index idx_log_org on public.log_aktivitas(organisasi_id);
create index idx_log_profil on public.log_aktivitas(profil_id);
create index idx_log_created on public.log_aktivitas(created_at desc);

-- ---------- TRIGGER updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profil_updated before update on public.profil
  for each row execute function public.set_updated_at();
create trigger trg_organisasi_updated before update on public.organisasi
  for each row execute function public.set_updated_at();
create trigger trg_site_updated before update on public.site
  for each row execute function public.set_updated_at();
create trigger trg_material_updated before update on public.material
  for each row execute function public.set_updated_at();

-- ---------- TRIGGER: auto-create profil setelah signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profil (id, email, nama_lengkap)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', split_part(new.email,'@',1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();