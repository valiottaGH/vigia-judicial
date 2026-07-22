-- Evita regenerar cédulas con el mismo archivo (ahorro de tokens IA)

alter table public.actuaciones_generadas
  add column if not exists source_content_hash text;

create index if not exists idx_actuaciones_generadas_source_hash
  on public.actuaciones_generadas (user_id, source_content_hash)
  where source_content_hash is not null;
