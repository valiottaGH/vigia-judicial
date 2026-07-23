-- Pagos Mercado Pago (Checkout Bricks)

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('pro', 'business')),
  amount_ars numeric(12, 2) not null,
  mercadopago_payment_id text,
  mercadopago_preference_id text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'in_process')),
  external_reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscription_payments_user
  on public.subscription_payments(user_id, created_at desc);

create index if not exists idx_subscription_payments_mp_payment
  on public.subscription_payments(mercadopago_payment_id)
  where mercadopago_payment_id is not null;

alter table public.profiles
  add column if not exists mercadopago_payer_id text;

comment on table public.subscription_payments is
  'Registro de intentos y pagos de suscripcion via Mercado Pago';
comment on column public.profiles.mercadopago_payer_id is
  'ID de pagador en Mercado Pago (cuando aplique)';

alter table public.subscription_payments enable row level security;

drop policy if exists "Usuarios ven sus pagos" on public.subscription_payments;
create policy "Usuarios ven sus pagos"
  on public.subscription_payments for select
  using (user_id = auth.uid());
