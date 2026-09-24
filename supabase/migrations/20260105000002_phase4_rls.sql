-- =========================================================
-- Phase 4A — RLS
-- =========================================================
alter table public.kategori_biaya enable row level security;
alter table public.pusat_biaya   enable row level security;
alter table public.vendor        enable row level security;
alter table public.pengeluaran   enable row level security;

-- ===== KATEGORI BIAYA =====
drop policy if exists kb_select on public.kategori_biaya;
create policy kb_select on public.kategori_biaya
  for select using (organisasi_id in (select public.organisasi_saya()));

drop policy if exists kb_manage on public.kategori_biaya;
create policy kb_manage on public.kategori_biaya
  for all using (public.punya_hak(organisasi_id, 'biaya.kelola'))
  with check (public.punya_hak(organisasi_id, 'biaya.kelola'));

-- ===== PUSAT BIAYA =====
drop policy if exists pb_select on public.pusat_biaya;
create policy pb_select on public.pusat_biaya
  for select using (organisasi_id in (select public.organisasi_saya()));

drop policy if exists pb_manage on public.pusat_biaya;
create policy pb_manage on public.pusat_biaya
  for all using (public.punya_hak(organisasi_id, 'biaya.kelola'))
  with check (public.punya_hak(organisasi_id, 'biaya.kelola'));

-- ===== VENDOR =====
drop policy if exists vendor_select on public.vendor;
create policy vendor_select on public.vendor
  for select using (organisasi_id in (select public.organisasi_saya()));

drop policy if exists vendor_manage on public.vendor;
create policy vendor_manage on public.vendor
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- ===== PENGELUARAN =====
-- Semua user dengan hak lihat_ringkasan boleh baca
drop policy if exists peng_select on public.pengeluaran;
create policy peng_select on public.pengeluaran
  for select using (
    organisasi_id in (select public.organisasi_saya())
    and (public.punya_hak(organisasi_id, 'biaya.lihat_ringkasan')
         or public.punya_hak(organisasi_id, 'biaya.lihat_rinci'))
  );

-- Insert/update hanya dengan biaya.kelola
drop policy if exists peng_insert on public.pengeluaran;
create policy peng_insert on public.pengeluaran
  for insert with check (public.punya_hak(organisasi_id, 'biaya.kelola'));

drop policy if exists peng_update on public.pengeluaran;
create policy peng_update on public.pengeluaran
  for update using (public.punya_hak(organisasi_id, 'biaya.kelola'))
  with check (public.punya_hak(organisasi_id, 'biaya.kelola'));

drop policy if exists peng_delete on public.pengeluaran;
create policy peng_delete on public.pengeluaran
  for delete using (
    public.punya_hak(organisasi_id, 'biaya.kelola')
    and status = 'draf'
  );