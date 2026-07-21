import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Expediente = Database["public"]["Tables"]["expedientes"]["Row"];
export type Novedad = Database["public"]["Tables"]["novedades"]["Row"];

export type ExpedienteInsert =
  Database["public"]["Tables"]["expedientes"]["Insert"];
export type NovedadInsert = Database["public"]["Tables"]["novedades"]["Insert"];

/** Expediente con novedades cargadas para listados del dashboard. */
export interface ExpedienteConNovedades extends Expediente {
  novedades: Novedad[];
  novedades_no_leidas: number;
}

export interface CrearExpedienteForm {
  numero: string;
  jurisdiccion: string;
  fuero?: string;
  caratula?: string;
}

export type Escrito = Database["public"]["Tables"]["escritos"]["Row"];
export type EscritoInsert = Database["public"]["Tables"]["escritos"]["Insert"];
export type EscritoUpdate = Database["public"]["Tables"]["escritos"]["Update"];

/** Datos del membrete del abogado (profiles + campos de escritos). */
export interface MembreteProfile {
  full_name: string | null;
  estudio_nombre: string | null;
  matricula: string | null;
  domicilio_profesional: string | null;
  telefono: string | null;
  ciudad: string | null;
}

export interface CrearEscritoRequest {
  titulo: string;
  tipo: string;
  contenido_html: string;
  variables?: Record<string, string>;
  expediente_id?: string | null;
}

export interface ActualizarEscritoRequest {
  titulo?: string;
  contenido_html?: string;
  estado?: "borrador" | "finalizado";
  variables?: Record<string, string>;
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
