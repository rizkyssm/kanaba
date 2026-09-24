-- =========================================================
-- Phase 6B — Security event & kolom keamanan profil
-- =========================================================

do $$ begin
  create type public.jenis_security_event as enum (
    'login_gagal','login_berhasil','logout',
    'akses_ditolak','cross_organisasi','privilege_escalation',
    'token_invalid','session_kedaluwarsa',
    'upload_invalid','rate_limit',
    'mfa_enrolled','mfa_verified','mfa_disabled','mfa_gagal'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.security_event (
  id bigserial primary key,
  organisasi_id uuid references public.organisasi(id) on delete set null,
  profil_id uuid references public.profil(id) on delete set null,
  jenis public.jenis_security_event not null,
  detail jsonb,
  ip text,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_sec_org on public.security_event(organisasi_id, created_at desc);
create index if not exists idx_sec_profil on public.security_event(profil_id, created_at desc);
create index if not exists idx_sec_jenis on public.security_event(jenis, created_at desc);

alter table public.security_event enable row level security;

drop policy if exists sec_select on public.security_event;
create policy sec_select on public.security_event
  for select using (
    organisasi_id is not null
    and public.punya_hak(organisasi_id, 'log.lihat')
  );

drop policy if exists sec_insert on public.security_event;
create policy sec_insert on public.security_event
  for insert with check (true);
  -- insert dibuka lebar agar app server dapat mencatat login gagal untuk user yang belum login

-- Kolom keamanan di profil
alter table public.profil
  add column if not exists mfa_required boolean not null default false;

alter table public.profil
  add column if not exists last_login_at timestamptz;

alter table public.profil
  add column if not exists last_login_ip text;

alter table public.profil
  add column if not exists login_gagal_berturut int not null default 0;

-- Tandai MFA wajib untuk peran sensitif
create or replace function public.terapkan_mfa_wajib(p_org uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update profil p
  set mfa_required = true
  where p.id in (
    select distinct ao.profil_id
    from anggota_organisasi ao
    join anggota_peran ap on ap.anggota_id = ao.id
    join peran_hak_akses pha on pha.peran_id = ap.peran_id
    where ao.organisasi_id = p_org
      and ao.status = 'aktif'
      and pha.hak_akses_kode in (
        'pengguna.kelola','organisasi.kelola','biaya.kelola','gaji.kelola',
        'biaya.lihat_rinci','gaji.lihat','laporan.keuangan'
      )
  );
$$;