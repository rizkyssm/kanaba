-- =========================================================
-- Produk & BOM
-- =========================================================

create table public.produk (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  kode text not null,
  nama text not null,
  satuan_id uuid references public.satuan(id) on delete set null,
  deskripsi text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);
create index idx_produk_org on public.produk(organisasi_id, aktif);

create trigger trg_produk_updated before update on public.produk
  for each row execute function public.set_updated_at();

create table public.bom (
  id uuid primary key default gen_random_uuid(),
  organisasi_id uuid not null references public.organisasi(id) on delete cascade,
  produk_id uuid not null references public.produk(id) on delete cascade,
  kode text not null,
  nama text not null,
  versi text not null default 'v1',
  catatan text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisasi_id, kode)
);
create index idx_bom_org on public.bom(organisasi_id);
create index idx_bom_produk on public.bom(produk_id);

create trigger trg_bom_updated before update on public.bom
  for each row execute function public.set_updated_at();

create table public.item_bom (
  id uuid primary key default gen_random_uuid(),
  bom_id uuid not null references public.bom(id) on delete cascade,
  material_id uuid not null references public.material(id),
  jumlah numeric(16,4) not null check (jumlah > 0),
  satuan_id uuid references public.satuan(id) on delete set null,
  catatan text,
  created_at timestamptz not null default now()
);
create index idx_item_bom_bom on public.item_bom(bom_id);

-- ===== RLS =====
alter table public.produk   enable row level security;
alter table public.bom      enable row level security;
alter table public.item_bom enable row level security;

create policy produk_select on public.produk
  for select using (organisasi_id in (select public.organisasi_saya()));
create policy produk_manage on public.produk
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

create policy bom_select on public.bom
  for select using (organisasi_id in (select public.organisasi_saya()));
create policy bom_manage on public.bom
  for all using (public.punya_hak(organisasi_id, 'data_induk.kelola'))
  with check (public.punya_hak(organisasi_id, 'data_induk.kelola'));

create policy item_bom_select on public.item_bom
  for select using (
    exists (select 1 from public.bom b
            where b.id = bom_id
              and b.organisasi_id in (select public.organisasi_saya()))
  );
create policy item_bom_manage on public.item_bom
  for all using (
    exists (select 1 from public.bom b
            where b.id = bom_id
              and public.punya_hak(b.organisasi_id, 'data_induk.kelola'))
  ) with check (
    exists (select 1 from public.bom b
            where b.id = bom_id
              and public.punya_hak(b.organisasi_id, 'data_induk.kelola'))
  );