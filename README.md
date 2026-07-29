# Fast Cedu

Herramienta para **abogados**: redactar escritos judiciales con plantillas, editor rich-text, export PDF y borradores con IA.

Documentacion completa: **[docs/PROYECTO.md](docs/PROYECTO.md)**

## Stack

- Next.js 15 (App Router)
- TypeScript + Tailwind CSS 4
- Supabase (Auth + PostgreSQL)
- TipTap (editor) + `@react-pdf/renderer` (PDF)
- OpenAI (generacion de borradores — opcional)

## Inicio rapido

```powershell
git clone https://github.com/valiottaGH/vigia-judicial.git
cd vigia-judicial
npm install
copy .env.local.example .env.local
npm run dev
```

### Supabase

Ejecuta en el SQL Editor, en orden:

1. `supabase/schema.sql`
2. `supabase/migrations/002_mvp_v2.sql`
3. `supabase/migrations/003_escritos.sql`
4. `supabase/migrations/004_subscriptions.sql`

### Variables minimas

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Escritos con IA (opcional)

Ver **[docs/ESCRITOS-IA.md](docs/ESCRITOS-IA.md)**.

```env
OPENAI_API_KEY=sk-...
```

Reinicia `npm run dev`. En **Nuevo escrito** elegi "Generar con IA" o usa "Regenerar con IA" en el editor.

## Modulos

| Modulo | Ruta | Estado |
|--------|------|--------|
| Escritos | `/dashboard/escritos` | Activo |
| Expedientes (manual) | `/dashboard/expedientes` | Activo |
| SISFE Santa Fe | — | Pausado — ver `_archive/sisfe/README.md` |

## UTF-8 en Windows

```powershell
powershell -ExecutionPolicy Bypass -File scripts\convert-to-utf8.ps1
```

## Licencia

Código abierto —
