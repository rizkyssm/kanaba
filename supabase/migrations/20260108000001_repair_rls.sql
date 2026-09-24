-- =========================================================
-- Repair RLS — Phase 2 & Phase 3 (idempoten)
-- Mengaktifkan RLS + recreate policy untuk tabel yang kehilangan RLS.
-- Aman dijalankan berulang.
-- =========================================================

-- =========================================================
-- 1) KEGIATAN
-- =========================================================
alter table public.kegiatan enable row level security;
drop policy if exists keg_select on public.kegiatan;
create policy keg_select on public.kegiatan
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists keg_manage on public.kegiatan;
create policy keg_manage on public.kegiatan
  for all using (public.punya_hak(organisasi_id, 'kegiatan.kelola'))
  with check (public.punya_hak(organisasi_id, 'kegiatan.kelola'));

-- =========================================================
-- 2) RIWAYAT STATUS KEGIATAN
-- =========================================================
alter table public.riwayat_status_kegiatan enable row level security;
drop policy if exists keg_riwayat_select on public.riwayat_status_kegiatan;
create policy keg_riwayat_select on public.riwayat_status_kegiatan
  for select using (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and k.organisasi_id in (select public.organisasi_saya()))
  );
drop policy if exists keg_riwayat_insert on public.riwayat_status_kegiatan;
create policy keg_riwayat_insert on public.riwayat_status_kegiatan
  for insert with check (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and public.punya_hak(k.organisasi_id, 'kegiatan.kelola'))
  );

-- =========================================================
-- 3) PERSONEL
-- =========================================================
alter table public.personel enable row level security;
drop policy if exists per_select on public.personel;
create policy per_select on public.personel
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists per_manage on public.personel;
create policy per_manage on public.personel
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- =========================================================
-- 4) PERSONEL KOMPENSASI (sensitif — gaji)
-- =========================================================
alter table public.personel_kompensasi enable row level security;
drop policy if exists per_komp_select on public.personel_kompensasi;
create policy per_komp_select on public.personel_kompensasi
  for select using (
    exists (select 1 from public.personel p where p.id = personel_id
            and public.punya_hak(p.organisasi_id, 'gaji.lihat'))
  );
drop policy if exists per_komp_manage on public.personel_kompensasi;
create policy per_komp_manage on public.personel_kompensasi
  for all using (
    exists (select 1 from public.personel p where p.id = personel_id
            and public.punya_hak(p.organisasi_id, 'gaji.kelola'))
  ) with check (
    exists (select 1 from public.personel p where p.id = personel_id
            and public.punya_hak(p.organisasi_id, 'gaji.kelola'))
  );

-- =========================================================
-- 5) PERSONEL KEGIATAN
-- =========================================================
alter table public.personel_kegiatan enable row level security;
drop policy if exists pk_select on public.personel_kegiatan;
create policy pk_select on public.personel_kegiatan
  for select using (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and k.organisasi_id in (select public.organisasi_saya()))
  );
drop policy if exists pk_manage on public.personel_kegiatan;
create policy pk_manage on public.personel_kegiatan
  for all using (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and public.punya_hak(k.organisasi_id, 'kegiatan.kelola'))
  ) with check (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and public.punya_hak(k.organisasi_id, 'kegiatan.kelola'))
  );

-- =========================================================
-- 6) ASET
-- =========================================================
alter table public.aset enable row level security;
drop policy if exists aset_select on public.aset;
create policy aset_select on public.aset
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists aset_manage on public.aset;
create policy aset_manage on public.aset
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- =========================================================
-- 7) ASET KEUANGAN (sensitif)
-- =========================================================
alter table public.aset_keuangan enable row level security;
drop policy if exists aset_keu_select on public.aset_keuangan;
create policy aset_keu_select on public.aset_keuangan
  for select using (
    exists (select 1 from public.aset a where a.id = aset_id
            and public.punya_hak(a.organisasi_id, 'biaya.lihat_rinci'))
  );
drop policy if exists aset_keu_manage on public.aset_keuangan;
create policy aset_keu_manage on public.aset_keuangan
  for all using (
    exists (select 1 from public.aset a where a.id = aset_id
            and public.punya_hak(a.organisasi_id, 'biaya.kelola'))
  ) with check (
    exists (select 1 from public.aset a where a.id = aset_id
            and public.punya_hak(a.organisasi_id, 'biaya.kelola'))
  );

-- =========================================================
-- 8) PEMAKAIAN ASET
-- =========================================================
alter table public.pemakaian_aset enable row level security;
drop policy if exists pa_select on public.pemakaian_aset;
create policy pa_select on public.pemakaian_aset
  for select using (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and k.organisasi_id in (select public.organisasi_saya()))
  );
drop policy if exists pa_manage on public.pemakaian_aset;
create policy pa_manage on public.pemakaian_aset
  for all using (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and public.punya_hak(k.organisasi_id, 'kegiatan.kelola'))
  ) with check (
    exists (select 1 from public.kegiatan k where k.id = kegiatan_id
            and public.punya_hak(k.organisasi_id, 'kegiatan.kelola'))
  );

-- =========================================================
-- 9) CATATAN HSE
-- =========================================================
alter table public.catatan_hse enable row level security;
drop policy if exists hse_select on public.catatan_hse;
create policy hse_select on public.catatan_hse
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists hse_manage on public.catatan_hse;
create policy hse_manage on public.catatan_hse
  for all using (public.punya_hak(organisasi_id, 'kegiatan.kelola'))
  with check (public.punya_hak(organisasi_id, 'kegiatan.kelola'));

-- =========================================================
-- 10) TRANSAKSI PERSEDIAAN (ledger)
-- =========================================================
alter table public.transaksi_persediaan enable row level security;
drop policy if exists tp_select on public.transaksi_persediaan;
create policy tp_select on public.transaksi_persediaan
  for select using (
    organisasi_id in (select public.organisasi_saya())
    and public.punya_hak(organisasi_id, 'persediaan.lihat_jumlah')
  );
drop policy if exists tp_manage on public.transaksi_persediaan;
create policy tp_manage on public.transaksi_persediaan
  for all using (public.punya_hak(organisasi_id, 'persediaan.kelola'))
  with check (public.punya_hak(organisasi_id, 'persediaan.kelola'));

-- =========================================================
-- 11) PENGELUARAN MATERIAL
-- =========================================================
alter table public.pengeluaran_material enable row level security;
drop policy if exists pm_select on public.pengeluaran_material;
create policy pm_select on public.pengeluaran_material
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists pm_manage on public.pengeluaran_material;
create policy pm_manage on public.pengeluaran_material
  for all using (public.punya_hak(organisasi_id, 'persediaan.kelola'))
  with check (public.punya_hak(organisasi_id, 'persediaan.kelola'));

alter table public.pengeluaran_material_item enable row level security;
drop policy if exists pmi_select on public.pengeluaran_material_item;
create policy pmi_select on public.pengeluaran_material_item
  for select using (
    exists (select 1 from public.pengeluaran_material pm where pm.id = pengeluaran_id
            and pm.organisasi_id in (select public.organisasi_saya()))
  );
drop policy if exists pmi_manage on public.pengeluaran_material_item;
create policy pmi_manage on public.pengeluaran_material_item
  for all using (
    exists (select 1 from public.pengeluaran_material pm where pm.id = pengeluaran_id
            and public.punya_hak(pm.organisasi_id, 'persediaan.kelola'))
  ) with check (
    exists (select 1 from public.pengeluaran_material pm where pm.id = pengeluaran_id
            and public.punya_hak(pm.organisasi_id, 'persediaan.kelola'))
  );

-- =========================================================
-- 12) PENGEMBALIAN MATERIAL
-- =========================================================
alter table public.pengembalian_material enable row level security;
drop policy if exists pkm_select on public.pengembalian_material;
create policy pkm_select on public.pengembalian_material
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists pkm_manage on public.pengembalian_material;
create policy pkm_manage on public.pengembalian_material
  for all using (public.punya_hak(organisasi_id, 'persediaan.kelola'))
  with check (public.punya_hak(organisasi_id, 'persediaan.kelola'));

alter table public.pengembalian_material_item enable row level security;
drop policy if exists pkmi_select on public.pengembalian_material_item;
create policy pkmi_select on public.pengembalian_material_item
  for select using (
    exists (select 1 from public.pengembalian_material pm where pm.id = pengembalian_id
            and pm.organisasi_id in (select public.organisasi_saya()))
  );
drop policy if exists pkmi_manage on public.pengembalian_material_item;
create policy pkmi_manage on public.pengembalian_material_item
  for all using (
    exists (select 1 from public.pengembalian_material pm where pm.id = pengembalian_id
            and public.punya_hak(pm.organisasi_id, 'persediaan.kelola'))
  ) with check (
    exists (select 1 from public.pengembalian_material pm where pm.id = pengembalian_id
            and public.punya_hak(pm.organisasi_id, 'persediaan.kelola'))
  );

-- =========================================================
-- 13) TRANSAKSI LOX
-- =========================================================
alter table public.transaksi_lox enable row level security;
drop policy if exists lox_select on public.transaksi_lox;
create policy lox_select on public.transaksi_lox
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists lox_manage on public.transaksi_lox;
create policy lox_manage on public.transaksi_lox
  for all using (public.punya_hak(organisasi_id, 'persediaan.kelola'))
  with check (public.punya_hak(organisasi_id, 'persediaan.kelola'));

-- =========================================================
-- 14) PEMERIKSAAN FISIK
-- =========================================================
alter table public.pemeriksaan_fisik enable row level security;
drop policy if exists pf_select on public.pemeriksaan_fisik;
create policy pf_select on public.pemeriksaan_fisik
  for select using (organisasi_id in (select public.organisasi_saya()));
drop policy if exists pf_insert on public.pemeriksaan_fisik;
create policy pf_insert on public.pemeriksaan_fisik
  for insert with check (public.punya_hak(organisasi_id, 'persediaan.buat_pemeriksaan'));
drop policy if exists pf_update on public.pemeriksaan_fisik;
create policy pf_update on public.pemeriksaan_fisik
  for update using (
    public.punya_hak(organisasi_id, 'persediaan.buat_pemeriksaan')
    or public.punya_hak(organisasi_id, 'persediaan.penyesuaian')
    or public.punya_hak(organisasi_id, 'persediaan.kelola')
  ) with check (true);

alter table public.pemeriksaan_fisik_item enable row level security;
drop policy if exists pfi_select on public.pemeriksaan_fisik_item;
create policy pfi_select on public.pemeriksaan_fisik_item
  for select using (
    exists (select 1 from public.pemeriksaan_fisik pf
            where pf.id = pemeriksaan_id
              and pf.organisasi_id in (select public.organisasi_saya()))
  );
drop policy if exists pfi_manage on public.pemeriksaan_fisik_item;
create policy pfi_manage on public.pemeriksaan_fisik_item
  for all using (
    exists (select 1 from public.pemeriksaan_fisik pf
            where pf.id = pemeriksaan_id
              and (public.punya_hak(pf.organisasi_id, 'persediaan.buat_pemeriksaan')
                   or public.punya_hak(pf.organisasi_id, 'persediaan.kelola')))
  ) with check (
    exists (select 1 from public.pemeriksaan_fisik pf
            where pf.id = pemeriksaan_id
              and (public.punya_hak(pf.organisasi_id, 'persediaan.buat_pemeriksaan')
                   or public.punya_hak(pf.organisasi_id, 'persediaan.kelola')))
  );