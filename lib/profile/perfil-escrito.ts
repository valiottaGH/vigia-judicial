import type { MembreteProfile } from "@/types";
import type { PerfilEscritoResumen } from "@/lib/cedulas/preparar-escrito";
import { LABEL_CARACTER } from "@/lib/cedulas/preparar-escrito";
import { isMembreteCompleto } from "@/lib/profile/membrete";

export function perfilParaEscrito(
  profile: MembreteProfile | null | undefined
): PerfilEscritoResumen {
  const matriculaPartes = [
    profile?.matricula_tomo ? `Tº ${profile.matricula_tomo}` : null,
    profile?.matricula_folio ? `Fº ${profile.matricula_folio}` : null,
    profile?.matricula ? `Mat. ${profile.matricula}` : null,
  ].filter(Boolean);

  return {
    nombre: profile?.full_name?.trim() ?? "",
    matricula: matriculaPartes.join(" · ") || profile?.matricula?.trim() || "",
    estudio: profile?.estudio_nombre?.trim() || undefined,
    cuit_cuil: profile?.cuit_cuil?.trim() || undefined,
    caracter: profile?.caracter
      ? LABEL_CARACTER[profile.caracter] ?? profile.caracter
      : undefined,
    domicilio_electronico: profile?.domicilio_electronico?.trim() || undefined,
    domicilio_profesional: profile?.domicilio_profesional?.trim() || undefined,
    completo: isMembreteCompleto(profile),
  };
}

export const PERFIL_ESCRITO_SELECT =
  "full_name, estudio_nombre, matricula, matricula_tomo, matricula_folio, cuit_cuil, caracter, domicilio_electronico, domicilio_profesional, telefono, ciudad";
