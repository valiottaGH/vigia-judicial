# Autenticacion — Google y registro

## Google Sign-In

### 1. Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → crear proyecto (o usar uno existente)
2. **APIs & Services → OAuth consent screen** → External → completar nombre y email
3. **Credentials → Create Credentials → OAuth client ID**
   - Tipo: **Web application**
   - **Authorized redirect URIs** (copiar de Supabase, paso 2):
     ```
     https://TU-PROYECTO.supabase.co/auth/v1/callback
     ```
4. Copiar **Client ID** y **Client Secret**

### 2. Supabase

**Authentication → Providers → Google**

- Enable Google
- Pegar Client ID y Client Secret
- Guardar

**Authentication → URL Configuration**

- Site URL: tu dominio (ej. `https://fast-cedu.vercel.app`)
- Redirect URLs:
  ```
  https://tu-app.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

### 3. Vercel

No hace falta variable extra para Google. Redeploy si cambiaste URLs en Supabase.

---

## Email duplicado

- Antes de registrar, la app consulta `/api/auth/check-email`
- Requiere migracion `005_auth_email_check.sql` en Supabase SQL Editor
- Un email = una cuenta (email/contrasena o Google, no dos registros)

---

## Registro con contrasena

- Campo **Repetir contrasena** obligatorio
- Minimo 8 caracteres
- Deben coincidir antes de enviar

---

## Duracion de sesion

La app **no mantiene la sesion indefinidamente**:

| Regla | Valor |
|-------|-------|
| Duracion maxima | 8 horas desde el inicio de sesion |
| Inactividad | Cierre automatico tras 2 horas sin uso |
| Cookies | `maxAge` de 8 h en tokens Supabase |

Configuracion en codigo: `lib/auth/session-config.ts`.

Tras expirar, el usuario vuelve a `/login?reason=session_expired`.

En **Supabase → Authentication → Settings** podes acortar JWT expiry o refresh token lifetime si queres limites mas estrictos a nivel servidor.

---

## Planes (Gratis, Pro, Business)

| Plan | Generaciones IA / mes | Precio |
|------|------------------------|--------|
| Gratis | 5 | $0 |
| Pro | 500 | $5.000 ARS / mes |
| Business | 1.500 | $10.000 ARS / mes |

- Definicion en codigo: `lib/subscription/plans.ts` y `lib/subscription/entitlements.ts`
- Migracion `011_business_plan.sql` agrega el plan `business` en Supabase
- Para activar Pro o Business manualmente: en Supabase → Table Editor → `profiles` → columna `plan` = `pro` o `business`, `subscription_status` = `active`

---

## Administrador

### Crear tu usuario admin (una sola vez)

1. **Registrate** en la app con tu email (o iniciá sesión si ya tenés cuenta).
2. En **Supabase → SQL Editor**, ejecutá las migraciones `011_business_plan.sql` y `012_admin_role.sql` si aún no corrieron.
3. Ejecutá este SQL reemplazando tu email:

```sql
update public.profiles
set
  is_admin = true,
  plan = 'business',
  subscription_status = 'active'
where email = 'tu@email.com';
```

4. Cerrá sesión y volvé a entrar. En el menú de usuario vas a ver **Administración**.

**Alternativa rápida (sin SQL):** agregá tu email en `.env.local` y en Vercel:

```
ADMIN_EMAILS=tu@email.com
```

Eso te da acceso admin aunque `is_admin` siga en `false` en la base.

### Panel de administración

Ruta: `/dashboard/admin`

Desde ahí podés ver todos los usuarios y cambiar:
- **Plan** (Gratis / Pro / Business)
- **Estado** de suscripción (`active`, `canceled`, etc.)
- **Admin** (checkbox)

Cada fila tiene un botón **Guardar**. Los admins tienen generaciones IA ilimitadas.
