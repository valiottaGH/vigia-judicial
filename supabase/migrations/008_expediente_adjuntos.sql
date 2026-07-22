-- Adjuntos PDF/Word en expedientes

create table if not exists public.expediente_adjuntos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre_original text not null,
  storage_path text not null,
  mime_type text not null,
  tamano_bytes integer not null check (tamano_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_expediente_adjuntos_expediente
  on public.expediente_adjuntos(expediente_id);

alter table public.expediente_adjuntos enable row level security;

drop policy if exists "Usuarios ven adjuntos de sus expedientes" on public.expediente_adjuntos;
create policy "Usuarios ven adjuntos de sus expedientes"
  on public.expediente_adjuntos for select
  using (user_id = auth.uid());

drop policy if exists "Usuarios insertan adjuntos en sus expedientes" on public.expediente_adjuntos;
create policy "Usuarios insertan adjuntos en sus expedientes"
  on public.expediente_adjuntos for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.expedientes e
      where e.id = expediente_adjuntos.expediente_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists "Usuarios eliminan adjuntos propios" on public.expediente_adjuntos;
create policy "Usuarios eliminan adjuntos propios"
  on public.expediente_adjuntos for delete
  using (user_id = auth.uid());

-- Storage bucket (crear en Supabase Dashboard si no existe):
-- nombre: expediente-adjuntos, privado
