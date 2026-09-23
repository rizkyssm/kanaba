-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profil              enable row level security;
alter table public.organisasi          enable row level security;
alter table public.anggota_organisasi  enable row level security;
alter table public.peran               enable row level security;
alter table public.hak_akses           enable row level security;
alter table public.peran_hak_akses     enable row level security;
alter table public.anggota_peran       enable row level security;
alter table public.site                enable row level security;
alter table public.satuan              enable row level security;
alter table public.kategori_material   enable row level security;
alter table public.material            enable row level security;
alter table public.log_aktivitas       enable row level security;

-- ---------- PROFIL ----------
create policy profil_select_self on public.profil
  for select using (id = auth.uid());

create policy profil_update_self on public.profil
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Anggota organisasi yang sama boleh melihat profil rekan
create policy profil_select_rekan on public.profil
  for select using (
    exists (
      select 1 from public.anggota_organisasi a
      join public.anggota_organisasi b on a.organisasi_id = b.organisasi_id
      where a.profil_id = auth.uid() and b.profil_id = profil.id and a.status = 'aktif'
    )
  );

-- ---------- ORGANISASI ----------
create policy organisasi_select on public.organisasi
  for select using (id in (select public.organisasi_saya()));

-- ---------- ANGGOTA ORGANISASI ----------
create policy anggota_select on public.anggota_organisasi
  for select using (organisasi_id in (select public.organisasi_saya()));

create policy anggota_manage on public.anggota_organisasi
  for all using (public.punya_hak(organisasi_id, 'pengguna.kelola'))
  with check (public.punya_hak(organisasi_id, 'pengguna.kelola'));

-- ---------- PERAN ----------
create policy peran_select on public.peran
  for select using (organisasi_id in (select public.organisasi_saya()));

create policy peran_manage on public.peran
  for all using (public.punya_hak(organisasi_id, 'pengguna.kelola'))
  with check (public.punya_hak(organisasi_id, 'pengguna.kelola'));

-- ---------- HAK AKSES ----------
create policy hak_akses_select on public.hak_akses
  for select using (auth.role() = 'authenticated');

-- ---------- PERAN × HAK AKSES ----------
create policy pha_select on public.peran_hak_akses
  for select using (
    exists (select 1 from public.peran p where p.id = peran_id and p.organisasi_id in (select public.organisasi_saya()))
  );

create policy pha_manage on public.peran_hak_akses
  for all using (
    exists (select 1 from public.peran p where p.id = peran_id and public.punya_hak(p.organisasi_id, 'pengguna.kelola'))
  ) with check (
    exists (select 1 from public.peran p where p.id = peran_id and public.punya_hak(p.organisasi_id, 'pengguna.kelola'))
  );

-- ---------- ANGGOTA × PERAN ----------
create policy ap_select on public.anggota_peran
  for select using (
    exists (select 1 from public.anggota_organisasi ao where ao.id = anggota_id and ao.organisasi_id in (select public.organisasi_saya()))
  );

create policy ap_manage on public.anggota_peran
  for all using (
    exists (select 1 from public.anggota_organisasi ao where ao.id = anggota_id and public.punya_hak(ao.organisasi_id, 'pengguna.kelola'))
  ) with check (
    exists (select 1 from public.anggota_organisasi ao where ao.id = anggota_id and public.punya_hak(ao.organisasi_id, 'pengguna.kelola'))
  );

-- ---------- SITE ----------
create policy site_select on public.site
  for select using (organisasi_id in (select public.organisasi_saya()));

create policy site_manage on public.site
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- ---------- SATUAN ----------
create policy satuan_select on public.satuan
  for select using (organisasi_id in (select public.organisasi_saya()));
create policy satuan_manage on public.satuan
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- ---------- KATEGORI MATERIAL ----------
create policy km_select on public.kategori_material
  for select using (organisasi_id in (select public.organisasi_saya()));
create policy km_manage on public.kategori_material
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- ---------- MATERIAL ----------
create policy material_select on public.material
  for select using (organisasi_id in (select public.organisasi_saya()));
create policy material_manage on public.material
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- ---------- LOG AKTIVITAS ----------
-- Hanya user dengan hak 'log.lihat' pada organisasi tersebut
create policy log_select on public.log_aktivitas
  for select using (
    organisasi_id is not null and public.punya_hak(organisasi_id, 'log.lihat')
  );

-- Insert log: service role (server) — by default tidak ada policy untuk insert dari client.
-- Server memakai service role yang bypass RLS.