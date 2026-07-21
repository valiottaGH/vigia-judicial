# SISFE — codigo archivado (pausado)

La integracion con **SISFE Santa Fe** (login asistido, Bearer token, consulta de
novedades) fue **pausada** en julio 2026. El producto actual es **administrativo**:
escritos, expedientes manuales y configuracion del estudio.

## Que habia aca

- Conexion de sesion SISFE (`/conectar-sisfe`, token JWT)
- Cliente API: `findByFilter`, `findNovedadesById`
- Parser HTML para calibracion (`/dashboard/sisfe-debug`)
- Consulta automatica + emails Resend (`/api/expedientes/check`)

## Por que se saco del codigo activo

- SISFE no devolvia novedades de forma estable sin calibrar mas endpoints
- El foco del MVP paso a **escritos con plantillas y PDF**
- Menos superficie = mas facil de mantener

## Como restaurar

1. Busca en el historial de git los archivos bajo `lib/sisfe/`, `app/conectar-sisfe/`,
   `app/api/sisfe/`, etc. (commit anterior a la limpieza administrativa)
2. Ejecuta migracion `supabase/migrations/002_mvp_v2.sql` si no esta aplicada
3. Configura variables SISFE en `.env.local` (ver ejemplo comentado en `.env.local.example`)

## Tablas Supabase que siguen existiendo

- `sisfe_sessions` — sesiones cifradas (no se usan hasta reactivar)
- `consultas_log`, `notification_log` — logs del modulo SISFE

No hace falta borrarlas; no molestan.
