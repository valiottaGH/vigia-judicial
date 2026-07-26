-- Datos de firma y matriculación del letrado (categoría 3 — perfil, no se piden en cada escrito)
alter table public.profiles
  add column if not exists cuit_cuil text,
  add column if not exists matricula_tomo text,
  add column if not exists matricula_folio text,
  add column if not exists caracter text check (caracter in ('propio', 'apoderado', 'patrocinante')),
  add column if not exists domicilio_electronico text;

comment on column public.profiles.cuit_cuil is 'CUIT/CUIL del letrado para escritos y oficios';
comment on column public.profiles.caracter is 'Carácter: propio, apoderado o patrocinante';
comment on column public.profiles.domicilio_electronico is 'Casillero / domicilio electrónico procesal';
