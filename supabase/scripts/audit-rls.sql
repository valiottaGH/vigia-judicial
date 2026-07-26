-- =============================================================================
-- Fast Cedu — Auditoría RLS para producción
-- Ejecutar en: Supabase Dashboard → SQL Editor (proyecto de prod)
-- =============================================================================

-- 1) Tablas public sin RLS habilitado (debería devolver 0 filas)
select
  n.nspname as schema,
  c.relname as table_name,
  'RLS DESACTIVADO' as problema
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by c.relname;

-- 2) Tablas con RLS pero sin políticas (acceso denegado a anon/authenticated)
select
  t.schemaname,
  t.tablename,
  'RLS ON pero sin policies' as problema
from pg_tables t
where t.schemaname = 'public'
  and exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = t.schemaname
      and c.relname = t.tablename
      and c.relkind = 'r'
      and c.relrowsecurity
  )
  and not exists (
    select 1
    from pg_policies p
    where p.schemaname = t.schemaname
      and p.tablename = t.tablename
  )
order by t.tablename;

-- 3) Políticas demasiado permisivas (USING/WITH CHECK = true)
select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = 'public'
  and (
    qual is not null and btrim(qual) in ('true', '(true)')
    or with_check is not null and btrim(with_check) in ('true', '(true)')
  )
order by tablename, policyname;

-- 4) Resumen de policies por tabla
select
  tablename,
  count(*) as policy_count,
  string_agg(distinct cmd, ', ' order by cmd) as operaciones
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- 5) Storage: buckets públicos (deberían ser privados)
select
  id,
  name,
  public,
  case when public then 'BUCKET PUBLICO — revisar' else 'ok' end as estado
from storage.buckets
where id in ('expediente-adjuntos', 'actuaciones')
order by id;

-- 6) Storage: policies en storage.objects
select
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- 7) Trigger de perfil al registrarse (debe existir)
select
  tgname as trigger_name,
  relname as on_table,
  'ok' as estado
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and tgname = 'on_auth_user_created'
  and not t.tgisinternal;

-- 8) Trigger anti-escalado de plan (migración 017)
select
  tgname as trigger_name,
  c.relname as on_table
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'profiles'
  and tgname = 'protect_profile_sensitive_columns'
  and not t.tgisinternal;

-- 9) Función is_email_registered (solo service_role; anon/authenticated = problema)
select
  p.proname as function_name,
  array_agg(distinct pr.rolname order by pr.rolname) as granted_to,
  case
    when bool_or(pr.rolname in ('anon', 'authenticated')) then 'REVOCAR anon/authenticated'
    when bool_or(pr.rolname = 'service_role') then 'ok'
    else 'revisar permisos'
  end as estado
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join (
  select pa.oid, r.rolname
  from pg_proc pa
  cross join lateral aclexplode(coalesce(pa.proacl, acldefault('f', pa.proowner))) acl
  join pg_roles r on r.oid = acl.grantee
) pr on pr.oid = p.oid
where n.nspname = 'public'
  and p.proname = 'is_email_registered'
group by p.proname;
