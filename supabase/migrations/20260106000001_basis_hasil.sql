-- =========================================================
-- Basis Hasil Kegiatan — mendukung kontrak per BCM, per lubang, dst.
-- =========================================================

do $$ begin
  create type public.basis_hasil_kegiatan as enum (
    'per_bcm',        -- volume pemberaian / galian
    'per_lubang',     -- jumlah lubang blasting dengan LOX
    'per_kegiatan',   -- flat per kegiatan (mis. jasa survey)
    'per_jam'         -- per jam operasi
  );
exception when duplicate_object then null; end $$;

alter table public.kegiatan
  add column if not exists basis_hasil public.basis_hasil_kegiatan not null default 'per_bcm';

alter table public.kegiatan
  add column if not exists target_lubang numeric(14,2) not null default 0;

alter table public.kegiatan
  add column if not exists aktual_lubang numeric(14,2) not null default 0;

alter table public.kegiatan
  add column if not exists rencana_lox_per_lubang_kg numeric(14,3) not null default 0;

create index if not exists idx_kegiatan_basis on public.kegiatan(organisasi_id, basis_hasil);

-- =========================================================
-- View: biaya per hasil (generic)
-- Menggantikan v_biaya_per_bcm.
-- =========================================================
drop view if exists public.v_biaya_per_hasil;
create view public.v_biaya_per_hasil
with (security_invoker = true)
as
with langsung as (
  select organisasi_id, kegiatan_id, sum(nilai)::numeric(16,2) as total
  from public.pengeluaran
  where jenis = 'langsung' and kegiatan_id is not null
    and status in ('disetujui','dibayar','dibukukan')
  group by organisasi_id, kegiatan_id
),
total_bcm as (
  select organisasi_id, sum(aktual_bcm)::numeric(16,2) as total
  from public.kegiatan
  where aktual_bcm > 0
  group by organisasi_id
),
total_lubang as (
  select organisasi_id, sum(aktual_lubang)::numeric(14,2) as total
  from public.kegiatan
  where aktual_lubang > 0
  group by organisasi_id
),
tidak_langsung as (
  select organisasi_id, sum(nilai)::numeric(16,2) as total
  from public.pengeluaran
  where jenis = 'tidak_langsung'
    and status in ('disetujui','dibayar','dibukukan')
  group by organisasi_id
),
lox_per_kegiatan as (
  select organisasi_id, kegiatan_id,
         sum(jumlah_kg)::numeric(14,2) as total_kg
  from public.transaksi_lox
  where jenis = 'pengeluaran_site' and kegiatan_id is not null
  group by organisasi_id, kegiatan_id
)
select
  k.id              as kegiatan_id,
  k.organisasi_id,
  k.nomor,
  k.nama,
  k.basis_hasil,
  k.tanggal,

  -- basis quantities
  k.aktual_bcm,
  k.aktual_lubang,
  k.target_bcm,
  k.target_lubang,

  -- lox
  coalesce(lk.total_kg, 0)::numeric(14,2) as total_lox_kg,

  -- biaya
  coalesce(l.total, 0)::numeric(16,2) as biaya_langsung,
  case
    when k.basis_hasil = 'per_bcm' and tb.total > 0
      then (coalesce(tl.total,0) * (k.aktual_bcm / tb.total))::numeric(16,2)
    when k.basis_hasil = 'per_lubang' and tlb.total > 0
      then (coalesce(tl.total,0) * (k.aktual_lubang / tlb.total))::numeric(16,2)
    else 0::numeric(16,2)
  end as biaya_tidak_langsung,

  -- biaya per satuan hasil (dipilih berdasarkan basis)
  case
    when k.basis_hasil = 'per_bcm' and k.aktual_bcm > 0
      then (
        coalesce(l.total,0)
        + case when tb.total > 0 then coalesce(tl.total,0) * (k.aktual_bcm / tb.total) else 0 end
      ) / k.aktual_bcm
    when k.basis_hasil = 'per_lubang' and k.aktual_lubang > 0
      then (
        coalesce(l.total,0)
        + case when tlb.total > 0 then coalesce(tl.total,0) * (k.aktual_lubang / tlb.total) else 0 end
      ) / k.aktual_lubang
    when k.basis_hasil = 'per_kegiatan'
      then (
        coalesce(l.total,0)
        + case when tlb.total > 0 then coalesce(tl.total,0) * (1.0 / greatest(1, (select count(*) from kegiatan where organisasi_id = k.organisasi_id and basis_hasil = 'per_kegiatan'))) else 0 end
      )
    else 0
  end::numeric(16,2) as biaya_per_unit,

  -- satuan label
  case k.basis_hasil
    when 'per_bcm' then 'BCM'
    when 'per_lubang' then 'Lubang'
    when 'per_kegiatan' then 'Kegiatan'
    when 'per_jam' then 'Jam'
    else 'Unit'
  end as satuan_hasil,

  -- lox per satuan hasil (berguna untuk analitik blasting)
  case
    when k.basis_hasil = 'per_bcm' and k.aktual_bcm > 0
      then (coalesce(lk.total_kg,0) / k.aktual_bcm)::numeric(14,3)
    when k.basis_hasil = 'per_lubang' and k.aktual_lubang > 0
      then (coalesce(lk.total_kg,0) / k.aktual_lubang)::numeric(14,3)
    else 0::numeric(14,3)
  end as lox_per_unit,

  -- total biaya (langsung + tidak langsung teralokasi)
  (
    coalesce(l.total,0)
    + case
        when k.basis_hasil = 'per_bcm' and tb.total > 0
          then coalesce(tl.total,0) * (k.aktual_bcm / tb.total)
        when k.basis_hasil = 'per_lubang' and tlb.total > 0
          then coalesce(tl.total,0) * (k.aktual_lubang / tlb.total)
        else 0
      end
  )::numeric(16,2) as total_biaya

from public.kegiatan k
left join langsung l          on l.kegiatan_id = k.id and l.organisasi_id = k.organisasi_id
left join lox_per_kegiatan lk on lk.kegiatan_id = k.id and lk.organisasi_id = k.organisasi_id
left join total_bcm tb        on tb.organisasi_id = k.organisasi_id
left join total_lubang tlb    on tlb.organisasi_id = k.organisasi_id
left join tidak_langsung tl   on tl.organisasi_id = k.organisasi_id;

-- Pertahankan view lama sebagai alias (agar halaman yang sudah ada tidak pecah)
drop view if exists public.v_biaya_per_bcm;
create view public.v_biaya_per_bcm
with (security_invoker = true)
as
select
  kegiatan_id,
  organisasi_id,
  nomor,
  nama,
  aktual_bcm,
  biaya_langsung,
  biaya_tidak_langsung,
  case when aktual_bcm > 0 then (biaya_langsung / aktual_bcm)::numeric(16,2) else 0 end as biaya_per_bcm_langsung,
  case when aktual_bcm > 0 then (total_biaya / aktual_bcm)::numeric(16,2) else 0 end as biaya_per_bcm_total,
  total_biaya
from public.v_biaya_per_hasil;