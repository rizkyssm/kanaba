-- =========================================================
-- Fix: pastikan function & trigger handle_new_user ada
-- Idempoten — aman dijalankan berulang
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profil (id, email, nama_lengkap)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'nama_lengkap',
      new.raw_user_meta_data->>'full_name',
      split_part(coalesce(new.email,'user'), '@', 1)
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

-- Pastikan trigger lama dibersihkan (idempoten)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();