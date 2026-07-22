-- Comprueba si un email ya existe en auth.users (solo desde API con service role)
create or replace function public.is_email_registered(check_email text)
returns boolean
language sql
security definer
set search_path = auth, public
stable
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(check_email))
  );
$$;

revoke all on function public.is_email_registered(text) from public;
grant execute on function public.is_email_registered(text) to service_role;
