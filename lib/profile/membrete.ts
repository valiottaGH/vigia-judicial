import type { MembreteProfile } from "@/types";

export const MEMBRETE_REQUIRED_MESSAGE =
  "Completá tu membrete (nombre y matrícula) para generar documentos.";

export function isMembreteCompleto(
  profile:
    | Pick<MembreteProfile, "full_name" | "matricula">
    | null
    | undefined
): boolean {
  return Boolean(profile?.full_name?.trim() && profile?.matricula?.trim());
}
