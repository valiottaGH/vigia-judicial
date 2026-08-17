-- Plantillas de cédula/oficio subidas por el usuario (modelos propios en DOCX)

create table if not exists public.plantillas_cedula_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  descripcion text,
  storage_path text not null,
  nombre_archivo text not null,
  mime_type text not null default 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  tamano_bytes integer not null check (tamano_bytes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plantillas_cedula_usuario_user_id_idx
  on public.plantillas_cedula_usuario(user_id);

alter table public.plantillas_cedula_usuario enable row level security;

drop policy if exists "Usuarios leen sus plantillas cedula" on public.plantillas_cedula_usuario;
create policy "Usuarios leen sus plantillas cedula"
  on public.plantillas_cedula_usuario for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Usuarios insertan sus plantillas cedula" on public.plantillas_cedula_usuario;
create policy "Usuarios insertan sus plantillas cedula"
  on public.plantillas_cedula_usuario for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Usuarios eliminan sus plantillas cedula" on public.plantillas_cedula_usuario;
create policy "Usuarios eliminan sus plantillas cedula"
  on public.plantillas_cedula_usuario for delete
  to authenticated
  using (auth.uid() = user_id);

-- Bucket de Storage para plantillas DOCX del usuario
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'plantillas-usuario',
  'plantillas-usuario',
  false,
  5242880,
  array['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuarios leen sus plantillas storage" on storage.objects;
create policy "Usuarios leen sus plantillas storage"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'plantillas-usuario'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios suben sus plantillas storage" on storage.objects;
create policy "Usuarios suben sus plantillas storage"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'plantillas-usuario'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios eliminan sus plantillas storage" on storage.objects;
create policy "Usuarios eliminan sus plantillas storage"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'plantillas-usuario'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
