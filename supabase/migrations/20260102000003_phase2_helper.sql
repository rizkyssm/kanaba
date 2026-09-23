-- Generator nomor kegiatan: KGT-YYYY-NNNN (per organisasi, per tahun)
create or replace function public.gen_nomor_kegiatan(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tahun int := extract(year from now())::int;
  v_next int;
begin
  perform pg_advisory_xact_lock(hashtext('kegiatan_' || p_org::text));
  select coalesce(max(split_part(nomor, '-', 3)::int), 0) + 1
    into v_next
    from public.kegiatan
   where organisasi_id = p_org
     and nomor like 'KGT-' || v_tahun || '-%';
  return 'KGT-' || v_tahun || '-' || lpad(v_next::text, 4, '0');
end $$;

-- Generator nomor dokumen umum: PREFIX-YYYY-NNNN
create or replace function public.gen_nomor_dokumen(p_org uuid, p_prefix text, p_tabel text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tahun int := extract(year from now())::int;
  v_next int;
  v_nomor text;
begin
  perform pg_advisory_xact_lock(hashtext(p_prefix || '_' || p_org::text));
  execute format(
    'select coalesce(max(split_part(nomor, ''-'', 3)::int), 0) + 1
     from public.%I
     where organisasi_id = $1 and nomor like $2',
    p_tabel
  ) into v_next using p_org, p_prefix || '-' || v_tahun || '-%';
  v_nomor := p_prefix || '-' || v_tahun || '-' || lpad(v_next::text, 4, '0');
  return v_nomor;
end $$;