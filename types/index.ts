import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Expediente = Database["public"]["Tables"]["expedientes"]["Row"];
export type ExpedienteAdjunto =
  Database["public"]["Tables"]["expediente_adjuntos"]["Row"];

export type ExpedienteInsert =
  Database["public"]["Tables"]["expedientes"]["Insert"];

/** Datos del membrete del abogado (profiles). */
export interface MembreteProfile {
  full_name: string | null;
  estudio_nombre: string | null;
  matricula: string | null;
  domicilio_profesional: string | null;
  telefono: string | null;
  ciudad: string | null;
}

export interface ActualizarMembreteRequest {
  full_name?: string;
  estudio_nombre?: string;
  matricula?: string;
  domicilio_profesional?: string;
  telefono?: string;
  ciudad?: string;
}

/** Perfil de cuenta (nombre, notificaciones, plan). */
export interface AccountProfile {
  full_name: string | null;
  notifications_email: boolean;
  plan: string;
  subscription_status: string;
  subscription_ends_at: string | null;
}

export interface ActualizarCuentaRequest {
  full_name?: string;
  notifications_email?: boolean;
}
