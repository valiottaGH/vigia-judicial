-- Agregar plan business al check constraint existente
alter table public.profiles drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'business'));

comment on column public.profiles.plan is 'Plan actual: free | pro | business';
