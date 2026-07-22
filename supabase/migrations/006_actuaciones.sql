-- Actuaciones judiciales masivas: partes, resoluciones, registros y storage

-- Juzgado opcional en expedientes (para encabezados de actuaciones)
alter table public.expedientes
  add column if not exists juzgado text;

-- Partes procesales del expediente
create table if not exists public.partes_expediente (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  nombre text not null,
  apellido text not null default '',
  rol text not null check (rol in ('actor', 'demandado', 'tercero', 'organismo')),
  domicilio text,
  documento text,
  created_at timestamptz not null default now()
);

create index if not exists idx_partes_expediente_expediente
  on public.partes_expediente(expediente_id);

-- Resoluciones / proveídos del expediente
create table if not exists public.resoluciones (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  fecha date not null,
  tipo text not null default 'proveido',
  texto text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_resoluciones_expediente
  on public.resoluciones(expediente_id);

-- Registro de paquetes generados
create table if not exists public.actuaciones_generadas (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo_actuacion text not null,
  resolucion_id uuid references public.resoluciones(id) on delete set null,
  instruccion text,
  jurisdiccion text not null,
  plantilla_key text not null,
  zip_path text not null,
  zip_url text,
  manifest jsonb not null default '{}',
  documentos_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_actuaciones_generadas_expediente
  on public.actuaciones_generadas(expediente_id);

-- RLS
alter table public.partes_expediente enable row level security;
alter table public.resoluciones enable row level security;
alter table public.actuaciones_generadas enable row level security;

drop policy if exists "Usuarios ven partes de sus expedientes" on public.partes_expediente;
create policy "Usuarios ven partes de sus expedientes"
  on public.partes_expediente for select
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = partes_expediente.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios insertan partes en sus expedientes" on public.partes_expediente;
create policy "Usuarios insertan partes en sus expedientes"
  on public.partes_expediente for insert
  with check (
    exists (
      select 1 from public.expedientes e
      where e.id = partes_expediente.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios actualizan partes de sus expedientes" on public.partes_expediente;
create policy "Usuarios actualizan partes de sus expedientes"
  on public.partes_expediente for update
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = partes_expediente.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios eliminan partes de sus expedientes" on public.partes_expediente;
create policy "Usuarios eliminan partes de sus expedientes"
  on public.partes_expediente for delete
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = partes_expediente.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios ven resoluciones de sus expedientes" on public.resoluciones;
create policy "Usuarios ven resoluciones de sus expedientes"
  on public.resoluciones for select
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = resoluciones.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios insertan resoluciones en sus expedientes" on public.resoluciones;
create policy "Usuarios insertan resoluciones en sus expedientes"
  on public.resoluciones for insert
  with check (
    exists (
      select 1 from public.expedientes e
      where e.id = resoluciones.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios actualizan resoluciones de sus expedientes" on public.resoluciones;
create policy "Usuarios actualizan resoluciones de sus expedientes"
  on public.resoluciones for update
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = resoluciones.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios eliminan resoluciones de sus expedientes" on public.resoluciones;
create policy "Usuarios eliminan resoluciones de sus expedientes"
  on public.resoluciones for delete
  using (
    exists (
      select 1 from public.expedientes e
      where e.id = resoluciones.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios ven actuaciones de sus expedientes" on public.actuaciones_generadas;
create policy "Usuarios ven actuaciones de sus expedientes"
  on public.actuaciones_generadas for select
  using (user_id = auth.uid());

drop policy if exists "Usuarios insertan actuaciones propias" on public.actuaciones_generadas;
create policy "Usuarios insertan actuaciones propias"
  on public.actuaciones_generadas for insert
  with check (user_id = auth.uid());

-- Storage bucket (crear manualmente en Supabase Dashboard si no existe):
-- nombre: actuaciones, privado, RLS por user_id en path {user_id}/{expediente_id}/...
