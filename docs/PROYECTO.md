# Vigia Judicial — guia del proyecto

SaaS para estudios juridicos en **Santa Fe (Argentina)**.

## Enfoque actual (2026)

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| **Escritos** | `/dashboard/escritos` | Plantillas, editor, PDF, generacion con IA |
| **Expedientes** | `/dashboard/expedientes` | Carga manual de causas y notas de novedad |
| **Configuracion** | `/dashboard/configuracion` | Membrete del estudio (PDF y plantillas) |
| **Cuenta** | `/dashboard/cuenta` | Perfil, contrasena, suscripcion |

## Estructura de carpetas

```
app/
  dashboard/          # UI principal (layout con sidebar)
  api/escritos/     # CRUD, PDF, generacion IA
  api/expedientes/  # CRUD expedientes (manual)
  api/profile/      # Membrete del abogado
components/
  escritos/         # Editor TipTap, formularios
  config/           # Membrete
  layout/           # DashboardShell (nav)
lib/
  escritos/         # Plantillas, PDF, IA
  supabase/         # Auth y DB
supabase/migrations/
_archive/sisfe/     # Documentacion del modulo SISFE pausado
```

## Escritos con IA

1. Configura `OPENAI_API_KEY` en `.env.local`
2. En **Nuevo escrito** o en el **editor**, usa el panel "Generar con IA"
3. Completa los datos del caso; la IA redacta el cuerpo en HTML
4. Revisa, edita y exporta PDF

Ver `docs/ESCRITOS-IA.md` para detalle.

## Setup local

```powershell
npm install
copy .env.local.example .env.local
# Completar Supabase + OPENAI_API_KEY
npm run dev
```

Migraciones Supabase (SQL Editor): `schema.sql`, `002_mvp_v2.sql`, `003_escritos.sql`

## Convenciones

- UTF-8 en todos los archivos (Windows: ver `scripts/convert-to-utf8.ps1`)
- Comentarios en espanol solo donde la logica no sea obvia
- SISFE: ver `_archive/sisfe/README.md` — no borrar tablas en Supabase
