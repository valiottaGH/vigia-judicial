import type { User } from "@supabase/supabase-js";

export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Confirmá tu email antes de usar funciones sensibles. Revisá tu bandeja de entrada.";

const OAUTH_PROVIDERS = new Set(["google", "github", "apple", "azure", "facebook"]);

export function isEmailVerified(user: User): boolean {
  if (user.email_confirmed_at) return true;

  // Proveedores OAuth confirman el email en el proveedor (p. ej. Google).
  return (
    user.identities?.some((identity) => OAUTH_PROVIDERS.has(identity.provider)) ??
    false
  );
}
