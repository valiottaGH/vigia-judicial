-- Buckets de Storage para adjuntos y actuaciones generadas

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('expediente-adjuntos', 'expediente-adjuntos', false, 52428800, null),
  ('actuaciones', 'actuaciones', false, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura/escritura para el usuario autenticado en su carpeta (userId/...)
drop policy if exists "Usuarios leen sus adjuntos" on storage.objects;
create policy "Usuarios leen sus adjuntos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'expediente-adjuntos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios suben sus adjuntos" on storage.objects;
create policy "Usuarios suben sus adjuntos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'expediente-adjuntos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios eliminan sus adjuntos" on storage.objects;
create policy "Usuarios eliminan sus adjuntos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'expediente-adjuntos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios leen sus actuaciones" on storage.objects;
create policy "Usuarios leen sus actuaciones"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'actuaciones'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios suben sus actuaciones" on storage.objects;
create policy "Usuarios suben sus actuaciones"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'actuaciones'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
