# Seguridad — Fast Cedu (Vigía Judicial)

Este documento describe las medidas de seguridad implementadas y la configuración recomendada para producción.

## Autenticación

- **Proveedor:** [Supabase Auth](https://supabase.com/docs/guides/auth) (no auth custom).
- **Contraseñas:** hasheadas por Supabase (bcrypt); nunca almacenamos contraseñas en texto plano.
- **Sesión:** cookies `httpOnly`, `Secure` en producción, `SameSite=Strict` en producción.
- **Expiración:** 8 h máximo absoluto + 2 h de inactividad en el cliente (`SessionGuard`).
- **Verificación de email:** obligatoria para generar documentos con IA, descargar actuaciones y pagar (`EMAIL_NOT_VERIFIED`).
- **2FA (MFA):** habilitable desde el dashboard de Supabase → Authentication → MFA. Recomendado para abogados que suben documentos sensibles.

### Rate limiting (login y APIs)

Supabase Auth aplica rate limiting en sus endpoints. Además, la app limita:

| Endpoint | Límite |
|----------|--------|
| `POST /api/auth/check-email` | 10 / 15 min por IP |
| `POST /api/cedulas/generar` | 20 / hora por usuario |
| `POST /api/webhooks/mercadopago` | 120 / min por IP |

## Documentos legales

- **Tránsito:** TLS 1.2+ (Vercel + Supabase). HSTS activo en producción.
- **Reposo:** buckets privados (`expediente-adjuntos`, `actuaciones`) con cifrado server-side de Supabase/S3.
- **URLs firmadas:** expiran en 1 h; descarga principal vía proxy autenticado `/api/actuaciones/[id]/descargar`.
- **Validación de archivos:** MIME + magic bytes (PDF, DOC, DOCX).
- **Auditoría:** tabla `security_audit_log` — subida, generación IA y descarga.
- **Minimización:** los documentos se conservan mientras el usuario los mantenga en su cuenta. Podés configurar retención automática con un job programado (pendiente).

### IA y datos sensibles

El texto extraído del proveído se envía a **OpenRouter** u **OpenAI** para interpretación.

- Configurá `OPENROUTER_API_KEY` con una cuenta que permita políticas de retención acordes a tu estudio.
- Revisá [políticas de OpenRouter](https://openrouter.ai/docs/privacy) y de OpenAI antes de procesar datos de terceros.
- Los abogados deben informar a sus clientes según Ley 25.326 (Argentina) y normativa aplicable.

## Mercado Pago

- **Tarjetas:** tokenización en el cliente (Card Payment Brick); el servidor nunca recibe PAN/CVV.
- **Credenciales:** `MERCADOPAGO_ACCESS_TOKEN` y `MERCADOPAGO_WEBHOOK_SECRET` solo en variables de entorno.
- **Webhooks:** validación HMAC del header `x-signature` + re-fetch del pago vía API MP.
- **Test vs prod:** usá credenciales de prueba en desarrollo; nunca mezclar tokens.

## Infraestructura

- **Secrets:** `.env.local` / Vercel Environment Variables; nunca en git.
- **RLS:** políticas por usuario en tablas sensibles; trigger `protect_profile_sensitive_columns` impide auto-escalar `plan` o `is_admin`.
- **Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **CORS:** Next.js same-origin por defecto; APIs solo desde la app.
- **Dependencias:** ejecutá `npm audit` periódicamente.

## Migraciones requeridas

Ejecutá en Supabase SQL Editor (en orden):

```
supabase/migrations/017_security_hardening.sql
```

## Variables de entorno adicionales

```env
# Firma de webhooks MP (Webhooks > Configurar > revelar clave)
MERCADOPAGO_WEBHOOK_SECRET=tu-clave-secreta-webhook
```

## Plan de respuesta a incidentes

1. **Contener:** rotar `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `OPENROUTER_API_KEY` si hay sospecha de filtración.
2. **Investigar:** revisar `security_audit_log` y logs de Vercel.
3. **Notificar:** usuarios afectados y, si corresponde, la Agencia de Acceso a la Información Pública (AAIP) según Ley 25.326.
4. **Recuperar:** restaurar desde backups cifrados de Supabase si hubo pérdida de datos.

## Pendiente / recomendado

- Pentest básico antes de escalar usuarios.
- MFA obligatorio para cuentas con plan Business.
- Subida directa a Storage (presigned URLs) para archivos > 4 MB.
- Job de retención/borrado automático de adjuntos antiguos.
