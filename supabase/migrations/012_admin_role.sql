-- Rol de administrador para gestionar usuarios y planes
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is 'Acceso al panel /dashboard/admin';

-- Tras registrarte, ejecutá (reemplazá el email):
-- update public.profiles
-- set is_admin = true, plan = 'business', subscription_status = 'active'
-- where email = 'tu@email.com';
