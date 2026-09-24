-- =========================================================
-- Phase 3 — Reparasi (idempoten)
-- Menambal objek yang hilang dari push pertama yang terputus.
-- =========================================================

-- ===== Enum =====
do $$ begin
  create type public.status_produksi as enum ('draf','selesai','dibatalkan');
exception when duplicate_object then null; end $$;

-- ===== Tabel produksi =====
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

-- ===== RLS =====
alter table public.produksi                    enable row level security;
alter table public.pemakaian_material_produksi enable row level security;
alter table public.alasan_penyesuaian          enable row level security;

drop policy if exists prod_select on public.produksi;
create policy prod_select on public.produksi
  for select using (organisasi_id in (select public.organisasi_saya()));

drop policy if exists prod_manage on public.produksi;
create policy prod_manage on public.produksi
  for all using (public.punya_hak(organisasi_id, 'produksi.kelola'))
  with check (public.punya_hak(organisasi_id, 'produksi.kelola'));

drop policy if exists pmp_select on public.pemakaian_material_produksi;
create policy pmp_select on public.pemakaian_material_produksi
  for select using (
    exists (select 1 from public.produksi p
            where p.id = produksi_id
              and p.organisasi_id in (select public.organisasi_saya()))
  );

drop policy if exists pmp_manage on public.pemakaian_material_produksi;
create policy pmp_manage on public.pemakaian_material_produksi
  for all using (
    exists (select 1 from public.produksi p
            where p.id = produksi_id
              and public.punya_hak(p.organisasi_id, 'produksi.kelola'))
  ) with check (
    exists (select 1 from public.produksi p
            where p.id = produksi_id
              and public.punya_hak(p.organisasi_id, 'produksi.kelola'))
  );

drop policy if exists alasan_select on public.alasan_penyesuaian;
create policy alasan_select on public.alasan_penyesuaian
  for select using (organisasi_id in (select public.organisasi_saya()));

drop policy if exists alasan_manage on public.alasan_penyesuaian;
create policy alasan_manage on public.alasan_penyesuaian
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

-- ===== Hak akses =====
insert into public.hak_akses (kode, modul, deskripsi, sensitif) values
  ('produksi.lihat',              'produksi',   'Lihat produksi', false),
  ('produksi.kelola',             'produksi',   'Kelola produksi', false),
  ('persediaan.buat_pemeriksaan', 'persediaan', 'Buat pemeriksaan fisik', false),
  ('persediaan.penyesuaian',      'persediaan', 'Setujui penyesuaian stok', false)
on conflict (kode) do nothing;

insert into public.peran_hak_akses (peran_id, hak_akses_kode)
select p.id, h.kode
from public.peran p
cross join (values
  ('produksi.lihat'),
  ('produksi.kelola'),
  ('persediaan.buat_pemeriksaan'),
  ('persediaan.penyesuaian')
) as h(kode)
where p.kode in ('admin','operasional','gudang')
on conflict do nothing;

-- ===== View saldo barang jadi =====
drop view if exists public.v_saldo_barang_jadi;
create view public.v_saldo_barang_jadi
with (security_invoker = true)
as
select
  p.organisasi_id,
  p.site_id,
  p.produk_id,
  sum(p.hasil_baik)::numeric(16,4) as saldo
from public.produksi p
where p.status = 'selesai'
group by p.organisasi_id, p.site_id, p.produk_id;

-- ===== RPC buat_produksi =====
create or replace function public.buat_produksi(
  p_organisasi uuid,
  p_site uuid,
  p_produk uuid,
  p_bom uuid,
  p_tanggal date,
  p_jumlah numeric,
  p_hasil_baik numeric,
  p_catatan text,
  p_items jsonb,
  p_user uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nomor text;
  v_id uuid;
  v_item jsonb;
begin
  v_nomor := gen_nomor_dokumen(p_organisasi, 'PRD', 'produksi');

  insert into produksi (
    organisasi_id, site_id, nomor, produk_id, bom_id, tanggal,
    jumlah_produksi, hasil_baik, status, catatan, penanggung_jawab_id
  ) values (
    p_organisasi, p_site, v_nomor, p_produk, p_bom, p_tanggal,
    p_jumlah, p_hasil_baik, 'selesai', p_catatan, p_user
  ) returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into pemakaian_material_produksi (
      produksi_id, material_id, jumlah, catatan
    ) values (
      v_id,
      (v_item->>'material_id')::uuid,
      (v_item->>'jumlah')::numeric,
      nullif(v_item->>'catatan','')
    );

    insert into transaksi_persediaan (
      organisasi_id, site_id, material_id, jenis, arah, jumlah,
      referensi_tipe, referensi_id, dibuat_oleh
    ) values (
      p_organisasi, p_site, (v_item->>'material_id')::uuid,
      'pemakaian_produksi', 'keluar',
      (v_item->>'jumlah')::numeric,
      'produksi', v_id, p_user
    );
  end loop;

  return v_id;
end $$;

-- ===== RPC proses_penyesuaian_pemeriksaan (idempoten) =====
create or replace function public.proses_penyesuaian_pemeriksaan(p_pemeriksaan uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_site uuid;
  v_status status_pemeriksaan_fisik;
  v_item record;
  v_jenis jenis_transaksi_persediaan;
  v_arah arah_transaksi;
  v_count int := 0;
  v_user uuid := auth.uid();
begin
  select organisasi_id, site_id, status
    into v_org, v_site, v_status
  from pemeriksaan_fisik where id = p_pemeriksaan;

  if v_org is null then
    raise exception 'Pemeriksaan tidak ditemukan';
  end if;
  if v_status <> 'disetujui_supervisor' then
    raise exception 'Pemeriksaan belum disetujui supervisor';
  end if;

  for v_item in
    select * from pemeriksaan_fisik_item
    where pemeriksaan_id = p_pemeriksaan and selisih <> 0
  loop
    if v_item.selisih > 0 then
      v_jenis := 'penyesuaian_positif';
      v_arah := 'masuk';
    else
      v_jenis := 'penyesuaian_negatif';
      v_arah := 'keluar';
    end if;

    insert into transaksi_persediaan (
      organisasi_id, site_id, material_id, jenis, arah, jumlah,
      referensi_tipe, referensi_id, catatan, dibuat_oleh
    ) values (
      v_org, v_site, v_item.material_id, v_jenis, v_arah, abs(v_item.selisih),
      'pemeriksaan_fisik', p_pemeriksaan,
      'Penyesuaian: ' || coalesce(v_item.alasan_kode, 'lainnya') ||
        case when v_item.catatan is not null then ' — ' || v_item.catatan else '' end,
      v_user
    );

    v_count := v_count + 1;
  end loop;

  update pemeriksaan_fisik
  set status = 'disetujui',
      disetujui_oleh = v_user,
      disetujui_at = now()
  where id = p_pemeriksaan;

  return v_count;
end $$;