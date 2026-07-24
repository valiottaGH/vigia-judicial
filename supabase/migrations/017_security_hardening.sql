-- Seguridad: proteger columnas sensibles de profiles, auditoría y rate limiting

-- ── Impedir auto-escalado de plan / admin desde el cliente ──
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo restringir cuando un usuario autenticado edita su propio perfil.
  -- Service role (auth.uid() null) y triggers internos pueden cambiar todo.
  if auth.uid() is not null and auth.uid() = old.id then
    new.plan := old.plan;
    new.subscription_status := old.subscription_status;
    new.subscription_ends_at := old.subscription_ends_at;
    new.stripe_customer_id := old.stripe_customer_id;
    new.mercadopago_payer_id := old.mercadopago_payer_id;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_sensitive_columns on public.profiles;
create trigger protect_profile_sensitive_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_sensitive_columns();

-- ── Auditoría de acceso a documentos ──
create table if not exists public.security_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_audit_log_user
  on public.security_audit_log (user_id, created_at desc);

create index if not exists idx_security_audit_log_action
  on public.security_audit_log (action, created_at desc);

alter table public.security_audit_log enable row level security;

drop policy if exists "Usuarios ven su auditoria" on public.security_audit_log;
create policy "Usuarios ven su auditoria"
  on public.security_audit_log for select
  using (user_id = auth.uid());

comment on table public.security_audit_log is
  'Trazabilidad: subida, descarga y procesamiento de documentos';

-- ── Rate limiting server-side (Supabase, compatible con Vercel serverless) ──
create table if not exists public.api_rate_limits (
  bucket_key text primary key,
  hits int not null default 1,
  window_start timestamptz not null default now()
);

create index if not exists idx_api_rate_limits_window
  on public.api_rate_limits (window_start);

alter table public.api_rate_limits enable row level security;

comment on table public.api_rate_limits is
  'Contadores de rate limit; solo accesible via service role';
