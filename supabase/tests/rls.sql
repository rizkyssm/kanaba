-- =========================================================
-- RLS Test KANABA — jalankan manual di SQL Editor
-- Semua hasil harus "PASS" atau "SKIP (belum ada data)"
-- =========================================================

-- =========================================================
-- 1) Staf lapangan tidak boleh lihat data biaya
-- =========================================================
do $$
declare
  v_uid uuid;
  v_org uuid;
  v_count int;
begin
  select p.id, ao.organisasi_id into v_uid, v_org
  from profil p
  join anggota_organisasi ao on ao.profil_id = p.id
  where not exists (
    select 1 from anggota_peran ap
    join peran_hak_akses pha on pha.peran_id = ap.peran_id
    where ap.anggota_id = ao.id and pha.hak_akses_kode = 'biaya.lihat_rinci'
  )
  limit 1;

  if v_uid is null then
    raise notice 'SKIP: belum ada user staf tanpa hak rinci';
    return;
  end if;

  perform set_config('request.jwt.claim.sub', v_uid::text, true);

  select count(*) into v_count from pengeluaran where organisasi_id = v_org;
  if v_count = 0 then
    raise notice 'PASS: staf tidak bisa lihat pengeluaran';
  else
    raise warning 'WARNING: staf bisa lihat % baris pengeluaran (cek policy)', v_count;
  end if;
end $$;

-- =========================================================
-- 2) Cross-organisasi: user Org A tidak bisa lihat kegiatan Org B
-- =========================================================
do $$
declare
  v_uid uuid;
  v_org_a uuid;
  v_org_b uuid;
  v_count int;
begin
  select ao.organisasi_id, p.id into v_org_a, v_uid
  from profil p
  join anggota_organisasi ao on ao.profil_id = p.id
  limit 1;

  select id into v_org_b from organisasi where id <> v_org_a limit 1;

  if v_org_b is null then
    raise notice 'SKIP: hanya ada satu organisasi';
    return;
  end if;

  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  select count(*) into v_count from kegiatan where organisasi_id = v_org_b;
  if v_count = 0 then
    raise notice 'PASS: cross-organisasi terblok';
  else
    raise warning 'WARNING: user bisa lihat % baris kegiatan org lain', v_count;
  end if;
end $$;

-- =========================================================
-- 3) Cek semua tabel bisnis punya RLS aktif
-- =========================================================
do $$
declare
  v_missing text;
begin
  select string_agg(c.relname, ', ') into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname not in ('schema_migrations')
    and not c.relrowsecurity;

  if v_missing is null then
    raise notice 'PASS: semua tabel public punya RLS aktif';
  else
    raise exception 'FAIL: tabel tanpa RLS: %', v_missing;
  end if;
end $$;

-- =========================================================
-- 4) Cek tidak ada policy dengan USING (true) yang bocor
-- =========================================================
do $$
declare
  v_sensitif text[] := array[
    'pengeluaran','transaksi_persediaan','pemeriksaan_fisik','produksi',
    'personel_kompensasi','aset_keuangan'
  ];
  v_row record;
begin
  for v_row in
    select c.relname as tabel, p.polname as policy
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(v_sensitif)
      and pg_get_expr(p.polqual, p.polrelid) = 'true'
  loop
    raise exception 'FAIL: tabel % punya policy % dengan USING (true)',
      v_row.tabel, v_row.policy;
  end loop;
  raise notice 'PASS: tidak ada policy bocor pada tabel sensitif';
end $$;