-- MVP v3: Modulo administrativo - Escritos y membrete del estudio
-- Idempotente

alter table public.profiles
  add column if not exists estudio_nombre text;

alter table public.profiles
  add column if not exists matricula text;

alter table public.profiles
  add column if not exists domicilio_profesional text;

alter table public.profiles
  add column if not exists telefono text;

alter table public.profiles
  add column if not exists ciudad text default 'Santa Fe';

create table if not exists public.escritos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  tipo text not null,
  contenido_html text not null default '',
  estado text not null default 'borrador'
    check (estado in ('borrador', 'finalizado')),
  expediente_id uuid references public.expedientes (id) on delete set null,
  variables jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_escritos_user_id on public.escritos (user_id);
create index if not exists idx_escritos_updated_at on public.escritos (updated_at desc);

alter table public.escritos enable row level security;

drop policy if exists "Usuarios ven sus escritos" on public.escritos;
create policy "Usuarios ven sus escritos"
  on public.escritos for select
  using (auth.uid() = user_id);

drop policy if exists "Usuarios crean sus escritos" on public.escritos;
create policy "Usuarios crean sus escritos"
  on public.escritos for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios actualizan sus escritos" on public.escritos;
create policy "Usuarios actualizan sus escritos"
  on public.escritos for update
  using (auth.uid() = user_id);

drop policy if exists "Usuarios eliminan sus escritos" on public.escritos;
create policy "Usuarios eliminan sus escritos"
  on public.escritos for delete
  using (auth.uid() = user_id);

drop trigger if exists set_escritos_updated_at on public.escritos;
create trigger set_escritos_updated_at
  before update on public.escritos
  for each row execute function public.set_updated_at();
