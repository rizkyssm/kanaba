-- =========================================================
-- Phase 6A — Notifikasi in-app
-- =========================================================

create type public.tipe_notifikasi as enum (
  'info','peringatan','persetujuan','stok','hse','biaya'
);

create table if not exists public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  penerima_id uuid not null references public.profil(id) on delete cascade,
  tipe public.tipe_notifikasi not null default 'info',
  judul text not null,
  pesan text,
  tautan text,
  entitas text,
  entitas_id uuid,
  dibaca boolean not null default false,
  dibaca_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_penerima on public.notifikasi(penerima_id, dibaca, created_at desc);
create index if not exists idx_notif_org on public.notifikasi(organisasi_id, created_at desc);

-- RLS
alter table public.notifikasi enable row level security;

drop policy if exists notif_select on public.notifikasi;
create policy notif_select on public.notifikasi
  for select using (penerima_id = auth.uid());

drop policy if exists notif_update on public.notifikasi;
create policy notif_update on public.notifikasi
  for update using (penerima_id = auth.uid())
  with check (penerima_id = auth.uid());

-- Helper: buat notifikasi untuk pengguna dengan hak tertentu
create or replace function public.kirim_notifikasi(
  p_org uuid,
  p_hak text,
  p_tipe public.tipe_notifikasi,
  p_judul text,
  p_pesan text default null,
  p_tautan text default null,
  p_entitas text default null,
  p_entitas_id uuid default null
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_user uuid;
begin
  for v_user in
    select distinct ao.profil_id
    from anggota_organisasi ao
    join anggota_peran ap on ap.anggota_id = ao.id
    join peran_hak_akses pha on pha.peran_id = ap.peran_id
    where ao.organisasi_id = p_org
      and ao.status = 'aktif'
      and pha.hak_akses_kode = p_hak
  loop
    insert into notifikasi (
      organisasi_id, penerima_id, tipe, judul, pesan, tautan, entitas, entitas_id
    ) values (
      p_org, v_user, p_tipe, p_judul, p_pesan, p_tautan, p_entitas, p_entitas_id
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;