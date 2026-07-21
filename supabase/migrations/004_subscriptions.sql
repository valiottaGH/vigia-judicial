-- Plan y suscripcion del usuario (Stripe se integrara despues)
alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro'));

alter table public.profiles
  add column if not exists subscription_status text not null default 'active'
    check (subscription_status in ('active', 'trialing', 'canceled', 'past_due', 'none'));

alter table public.profiles
  add column if not exists subscription_ends_at timestamptz;

alter table public.profiles
  add column if not exists stripe_customer_id text;

comment on column public.profiles.plan is 'Plan actual: free | pro';
comment on column public.profiles.subscription_status is 'Estado de suscripcion (Stripe futuro)';
comment on column public.profiles.subscription_ends_at is 'Fin del periodo pagado o de prueba';
comment on column public.profiles.stripe_customer_id is 'ID cliente Stripe (cuando se active pagos)';
