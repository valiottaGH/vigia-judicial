-- MVP v2: sesiones SISFE, disclaimer y notificaciones
-- Seguro para ejecutar mas de una vez (idempotente)

alter table public.profiles
  add column if not exists disclaimer_accepted_at timestamptz;

alter table public.profiles
  add column if not exists notifications_email boolean not null default true;

-- Sesiones SISFE (cookies cifradas por usuario)
create table if not exists public.sisfe_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  cookies_encrypted text not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'revoked')),
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sisfe_sessions_user_id on public.sisfe_sessions (user_id);
create index if not exists idx_sisfe_sessions_status on public.sisfe_sessions (status);

alter table public.sisfe_sessions enable row level security;

drop policy if exists "Usuarios ven su sesion SISFE" on public.sisfe_sessions;
create policy "Usuarios ven su sesion SISFE"
  on public.sisfe_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios crean su sesion SISFE" on public.sisfe_sessions;
create policy "Usuarios crean su sesion SISFE"
  on public.sisfe_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios actualizan su sesion SISFE" on public.sisfe_sessions;
create policy "Usuarios actualizan su sesion SISFE"
  on public.sisfe_sessions for update
  using (auth.uid() = user_id);

drop policy if exists "Usuarios eliminan su sesion SISFE" on public.sisfe_sessions;
create policy "Usuarios eliminan su sesion SISFE"
  on public.sisfe_sessions for delete
  using (auth.uid() = user_id);

drop trigger if exists set_sisfe_sessions_updated_at on public.sisfe_sessions;
create trigger set_sisfe_sessions_updated_at
  before update on public.sisfe_sessions
  for each row execute function public.set_updated_at();

-- Log de emails enviados
create table if not exists public.notification_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('novedad', 'sesion_expirada')),
  novedades_count integer not null default 0,
  sent_at timestamptz not null default now()
);

alter table public.notification_log enable row level security;

drop policy if exists "Usuarios ven sus notificaciones" on public.notification_log;
create policy "Usuarios ven sus notificaciones"
  on public.notification_log for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios registran sus notificaciones" on public.notification_log;
create policy "Usuarios registran sus notificaciones"
  on public.notification_log for insert
  with check (auth.uid() = user_id);
