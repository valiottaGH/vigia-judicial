-- Análisis IA de cédulas de ejemplo (campos variables detectados automáticamente)

alter table public.plantillas_cedula_usuario
  add column if not exists analisis_ia jsonb;
