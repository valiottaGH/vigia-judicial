-- Vigï뾽a Judicial — Esquema Supabase
-- Ejecutar en: Supabase Dashboard ⇯뾽 SQL Editor

-- Extensiï뾽n para UUID
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Perfiles de usuario (extiende auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuarios pueden ver su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- Expedientes monitoreados
-- ─────────────────────────────────────────────
create table public.expedientes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  numero text not null,
  jurisdiccion text not null,
  fuero text,
  caratula text,
  cisfe_id text,
  activo boolean not null default true,
  ultima_consulta timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, numero, jurisdiccion)
);

create index idx_expedientes_user_id on public.expedientes (user_id);
create index idx_expedientes_activo on public.expedientes (activo) where activo = true;

alter table public.expedientes enable row level security;

create policy "Usuarios ven sus expedientes"
  on public.expedientes for select
  using (auth.uid() = user_id);

create policy "Usuarios crean sus expedientes"
  on public.expedientes for insert
  with check (auth.uid() = user_id);

create policy "Usuarios actualizan sus expedientes"
  on public.expedientes for update
  using (auth.uid() = user_id);

create policy "Usuarios eliminan sus expedientes"
  on public.expedientes for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Novedades de expedientes (desde CISFE)
-- ─────────────────────────────────────────────
create table public.novedades (
  id uuid primary key default uuid_generate_v4(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  cisfe_novedad_id text not null,
  fecha timestamptz not null,
  tipo text not null,
  descripcion text not null,
  detalle jsonb default '{}'::jsonb,
  leida boolean not null default false,
  created_at timestamptz not null default now(),
  unique (expediente_id, cisfe_novedad_id)
);

create index idx_novedades_expediente_id on public.novedades (expediente_id);
create index idx_novedades_fecha on public.novedades (fecha desc);
create index idx_novedades_leida on public.novedades (leida) where leida = false;

alter table public.novedades enable row level security;

create policy "Usuarios ven novedades de sus expedientes"
  on public.novedades for select
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = novedades.expediente_id
        and e.user_id = auth.uid()
    )
  );

create policy "Usuarios marcan novedades como leï뾽das"
  on public.novedades for update
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = novedades.expediente_id
        and e.user_id = auth.uid()
    )
  );

create policy "Usuarios insertan novedades en sus expedientes"
  on public.novedades for insert
  with check (
    exists (
      select 1 from public.expedientes e
      where e.id = novedades.expediente_id
        and e.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Log de consultas a CISFE
-- ─────────────────────────────────────────────
create table public.consultas_log (
  id uuid primary key default uuid_generate_v4(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  status text not null check (status in ('ok', 'error', 'sin_novedades')),
  novedades_encontradas integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_consultas_log_expediente on public.consultas_log (expediente_id);

alter table public.consultas_log enable row level security;

create policy "Usuarios ven logs de sus expedientes"
  on public.consultas_log for select
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = consultas_log.expediente_id
        and e.user_id = auth.uid()
    )
  );

create policy "Usuarios insertan logs de sus expedientes"
  on public.consultas_log for insert
  with check (
    exists (
      select 1 from public.expedientes e
      where e.id = consultas_log.expediente_id
        and e.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Funciï뾽n: updated_at automï뾽tico
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_expedientes_updated_at
  before update on public.expedientes
  for each row execute function public.set_updated_at();
