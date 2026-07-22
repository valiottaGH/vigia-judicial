import type { Database } from "@/types/database";

export type ExpedienteAdjunto =
  Database["public"]["Tables"]["expediente_adjuntos"]["Row"];

export interface AdjuntoConUrl extends ExpedienteAdjunto {
  download_url?: string;
}
