-- Elimina tablas del modulo de novedades (SISFE / feed)

drop policy if exists "Usuarios ven novedades de sus expedientes" on public.novedades;
drop policy if exists "Usuarios marcan novedades como leidas" on public.novedades;
drop policy if exists "Usuarios marcan novedades como leï뾽das" on public.novedades;
drop policy if exists "Usuarios insertan novedades en sus expedientes" on public.novedades;

drop table if exists public.novedades cascade;

drop policy if exists "Usuarios ven logs de sus consultas" on public.consultas_log;
drop policy if exists "Usuarios insertan logs en sus expedientes" on public.consultas_log;

drop table if exists public.consultas_log cascade;

drop policy if exists "Usuarios ven su notification_log" on public.notification_log;
drop policy if exists "Usuarios insertan en notification_log" on public.notification_log;

drop table if exists public.notification_log cascade;
