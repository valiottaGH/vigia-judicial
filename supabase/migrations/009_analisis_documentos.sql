-- Análisis de documentos con IA

create table if not exists public.analisis_plantillas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  campos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documento_analisis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  expediente_id uuid references public.expedientes(id) on delete set null,
  plantilla_id uuid references public.analisis_plantillas(id) on delete set null,
  plantilla_key text,
  campos jsonb not null default '[]'::jsonb,
  adjunto_ids uuid[] not null default '{}',
  resultado jsonb,
  estado text not null default 'borrador'
    check (estado in ('borrador', 'procesando', 'completado', 'error')),
  error_mensaje text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documento_analisis_user
  on public.documento_analisis(user_id, updated_at desc);

create index if not exists idx_documento_analisis_expediente
  on public.documento_analisis(expediente_id);

create index if not exists idx_analisis_plantillas_user
  on public.analisis_plantillas(user_id);

alter table public.analisis_plantillas enable row level security;
alter table public.documento_analisis enable row level security;

drop policy if exists "Usuarios ven sus plantillas de analisis" on public.analisis_plantillas;
create policy "Usuarios ven sus plantillas de analisis"
  on public.analisis_plantillas for select
  using (user_id = auth.uid());

drop policy if exists "Usuarios crean plantillas de analisis" on public.analisis_plantillas;
create policy "Usuarios crean plantillas de analisis"
  on public.analisis_plantillas for insert
  with check (user_id = auth.uid());

drop policy if exists "Usuarios actualizan sus plantillas de analisis" on public.analisis_plantillas;
create policy "Usuarios actualizan sus plantillas de analisis"
  on public.analisis_plantillas for update
  using (user_id = auth.uid());

drop policy if exists "Usuarios eliminan sus plantillas de analisis" on public.analisis_plantillas;
create policy "Usuarios eliminan sus plantillas de analisis"
  on public.analisis_plantillas for delete
  using (user_id = auth.uid());

drop policy if exists "Usuarios ven sus analisis" on public.documento_analisis;
create policy "Usuarios ven sus analisis"
  on public.documento_analisis for select
  using (user_id = auth.uid());

drop policy if exists "Usuarios crean analisis" on public.documento_analisis;
create policy "Usuarios crean analisis"
  on public.documento_analisis for insert
  with check (user_id = auth.uid());

drop policy if exists "Usuarios actualizan sus analisis" on public.documento_analisis;
create policy "Usuarios actualizan sus analisis"
  on public.documento_analisis for update
  using (user_id = auth.uid());

drop policy if exists "Usuarios eliminan sus analisis" on public.documento_analisis;
create policy "Usuarios eliminan sus analisis"
  on public.documento_analisis for delete
  using (user_id = auth.uid());
