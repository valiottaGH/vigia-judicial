# Publicar el repo en GitHub (checklist)

Usá esta lista antes de hacer el repositorio **público** o antes de invitar colaboradores.

## Qué puede estar en el código (seguro)

| Variable / dato | ¿Puede ir en git? |
|-----------------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí (pública por diseño) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí (RLS protege los datos) |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Sí (clave pública de MP) |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL` | Sí |
| Placeholders en `.env.local.example` | Sí (`tu-...`, `APP_USR-...`) |

## Qué NUNCA debe estar en git

| Secreto | Dónde va |
|---------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel / `.env.local` |
| `MERCADOPAGO_ACCESS_TOKEN` | Vercel / `.env.local` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Vercel / `.env.local` |
| `OPENROUTER_API_KEY` / `OPENAI_API_KEY` | Vercel / `.env.local` |
| `RESEND_API_KEY` | Vercel / `.env.local` |
| Google OAuth Client Secret | Supabase dashboard |
| `.env.local`, `.env.production` | Solo local / Vercel |

## Verificación rápida (PowerShell / Git Bash)

Desde la raíz del proyecto:

```bash
git ls-files | grep -E '\.env\.local$|\.pem$|credentials'
# (no debe listar nada)

git log --all -p -S "sk-or-v1" --oneline | head
git log --all -p -S "eyJhbGci" --oneline | head
# Solo placeholders en .env.local.example, no keys reales
```

## Si alguna clave se filtró

1. **Rotá de inmediato** la clave en el panel del proveedor (Supabase, MP, OpenRouter, Resend, Google).
2. Actualizá Vercel Environment Variables.
3. Redeploy.
4. Si estuvo en git: considerá `git filter-repo` o GitHub secret scanning; para repos chicos a veces basta rotar.

## Archivos ignorados a propósito

- `scripts/test-*.ts`, `scripts/test-*.mjs` — pruebas locales con service role
- `scripts/tmp-*` — PDFs y fixtures temporales
- `.vercel/` — metadata de deploy

## Repo ya en GitHub

Si el repo es privado y querés hacerlo público: Settings → General → Danger zone → Change visibility.

Revisá que en **Issues/PRs** no hayas pegado keys en comentarios.
