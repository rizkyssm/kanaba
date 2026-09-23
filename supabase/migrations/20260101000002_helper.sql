-- Apakah user anggota organisasi tertentu?
create or replace function public.is_anggota_org(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.anggota_organisasi
    where organisasi_id = p_org
      and profil_id = auth.uid()
      and status = 'aktif'
  );
$$;

-- Apakah user punya hak akses tertentu di organisasi?
create or replace function public.punya_hak(p_org uuid, p_hak text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.anggota_organisasi ao
    join public.anggota_peran ap on ap.anggota_id = ao.id
    join public.peran_hak_akses pha on pha.peran_id = ap.peran_id
    where ao.organisasi_id = p_org
      and ao.profil_id = auth.uid()
      and ao.status = 'aktif'
      and pha.hak_akses_kode = p_hak
  );
$$;

-- Daftar organisasi user
create or replace function public.organisasi_saya()
returns setof uuid language sql stable security definer set search_path = public as $$
  select organisasi_id from public.anggota_organisasi
  where profil_id = auth.uid() and status = 'aktif';
$$;