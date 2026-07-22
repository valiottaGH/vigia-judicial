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
