-- =========================================================
-- Phase 4A — Biaya, Pengeluaran, Data Induk Terkait
-- =========================================================

-- ===== KATEGORI BIAYA =====
create table if not exists public.kategori_biaya (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  jenis text not null check (jenis in ('langsung','tidak_langsung')),
  klasifikasi text not null check (klasifikasi in ('opex','capex')),
  deskripsi text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);
create index if not exists idx_kb_org on public.kategori_biaya(organisasi_id, aktif);

-- ===== PUSAT BIAYA =====
create table if not exists public.pusat_biaya (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  site_id uuid references public.site(id),
  kode text not null,
  nama text not null,
  deskripsi text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);
create index if not exists idx_pb_org on public.pusat_biaya(organisasi_id, aktif);

-- ===== VENDOR =====
create table if not exists public.vendor (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  kategori text not null default 'lainnya' check (kategori in ('material','jasa','rental','aset','lainnya')),
  telepon text,
  email text,
  alamat text,
  npwp text,
  term_hari int not null default 30,
  catatan text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);
create index if not exists idx_vendor_org on public.vendor(organisasi_id, aktif);

-- ===== PENGELUARAN =====
do $$ begin
  create type public.status_pengeluaran_keu as enum (
    'draf','diajukan','diverifikasi_operasional','diverifikasi_keuangan',
    'disetujui','dibayar','dibukukan','ditolak','dibatalkan'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.cara_pembayaran as enum ('tunai','transfer','hutang','lainnya');
exception when duplicate_object then null; end $$;

create table if not exists public.pengeluaran (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  nomor text not null,
  tanggal date not null default current_date,
  site_id uuid references public.site(id),
  kegiatan_id uuid references public.kegiatan(id) on delete set null,
  kategori_biaya_id uuid not null references public.kategori_biaya(id),
  pusat_biaya_id uuid references public.pusat_biaya(id),
  vendor_id uuid references public.vendor(id),
  jenis text not null check (jenis in ('langsung','tidak_langsung')),
  klasifikasi text not null check (klasifikasi in ('opex','capex')),
  nilai numeric(16,2) not null check (nilai >= 0),
  cara_pembayaran public.cara_pembayaran not null default 'transfer',
  status public.status_pengeluaran_keu not null default 'draf',
  catatan text,
  bukti_url text,
  -- audit persetujuan
  dibuat_oleh uuid references public.profil(id),
  diajukan_at timestamptz,
  diverifikasi_operasional_oleh uuid references public.profil(id),
  diverifikasi_operasional_at timestamptz,
  diverifikasi_keuangan_oleh uuid references public.profil(id),
  diverifikasi_keuangan_at timestamptz,
  disetujui_oleh uuid references public.profil(id),
  disetujui_at timestamptz,
  dibayar_oleh uuid references public.profil(id),
  dibayar_at timestamptz,
  dibukukan_oleh uuid references public.profil(id),
  dibukukan_at timestamptz,
  alasan_penolakan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, nomor)
);
create index if not exists idx_peng_org on public.pengeluaran(organisasi_id, tanggal desc);
create index if not exists idx_peng_status on public.pengeluaran(organisasi_id, status);
create index if not exists idx_peng_kegiatan on public.pengeluaran(kegiatan_id);

drop trigger if exists trg_peng_updated on public.pengeluaran;
create trigger trg_peng_updated before update on public.pengeluaran
  for each row execute function public.set_updated_at();

-- ===== VIEW: biaya per kegiatan =====
drop view if exists public.v_biaya_kegiatan;
create view public.v_biaya_kegiatan
with (security_invoker = true)
as
select
  p.organisasi_id,
  p.kegiatan_id,
  sum(case when p.jenis = 'langsung' then p.nilai else 0 end)::numeric(16,2) as biaya_langsung,
  sum(case when p.jenis = 'tidak_langsung' then p.nilai else 0 end)::numeric(16,2) as biaya_tidak_langsung,
  sum(p.nilai)::numeric(16,2) as total_biaya
from public.pengeluaran p
where p.status in ('disetujui','dibayar','dibukukan')
  and p.kegiatan_id is not null
group by p.organisasi_id, p.kegiatan_id;

-- ===== VIEW: biaya per BCM =====
drop view if exists public.v_biaya_per_bcm;
create view public.v_biaya_per_bcm
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
  select organisasi_id, sum(aktual_bcm)::numeric(16,2) as bcm
  from public.kegiatan
  where aktual_bcm > 0
  group by organisasi_id
),
tidak_langsung as (
  select organisasi_id, sum(nilai)::numeric(16,2) as total
  from public.pengeluaran
  where jenis = 'tidak_langsung'
    and status in ('disetujui','dibayar','dibukukan')
  group by organisasi_id
)
select
  k.id as kegiatan_id,
  k.organisasi_id,
  k.nomor,
  k.nama,
  k.aktual_bcm,
  coalesce(l.total, 0)::numeric(16,2) as biaya_langsung,
  case when tb.bcm > 0
       then (coalesce(tl.total,0) * (k.aktual_bcm / tb.bcm))::numeric(16,2)
       else 0::numeric(16,2) end as biaya_tidak_langsung,
  case when k.aktual_bcm > 0
       then (coalesce(l.total,0) / k.aktual_bcm)::numeric(16,2)
       else 0::numeric(16,2) end as biaya_per_bcm_langsung,
  case when k.aktual_bcm > 0
       then ((coalesce(l.total,0)
             + case when tb.bcm > 0
                    then (coalesce(tl.total,0) * (k.aktual_bcm / tb.bcm))
                    else 0 end) / k.aktual_bcm)::numeric(16,2)
       else 0::numeric(16,2) end as biaya_per_bcm_total
from public.kegiatan k
left join langsung l on l.kegiatan_id = k.id and l.organisasi_id = k.organisasi_id
left join total_bcm tb on tb.organisasi_id = k.organisasi_id
left join tidak_langsung tl on tl.organisasi_id = k.organisasi_id;