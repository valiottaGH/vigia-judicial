import type { User } from "@supabase/supabase-js";

export const EMAIL_NOT_VERIFIED_MESSAGE =
  "Confirmá tu email antes de usar funciones sensibles. Revisá tu bandeja de entrada.";

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}
