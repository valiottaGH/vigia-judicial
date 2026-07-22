"use client";

import { TIPOS_ACTUACION_LABELS } from "@/lib/actuaciones/types";
import type { GenerarCedulaResponse } from "@/lib/cedulas/types";

const TRAMITE_LABELS: Record<string, string> = {
  peritos: "Designación / pericia",
  notificar_partes: "Notificar a las partes",
  liquidacion: "Liquidación",
  traslado: "Traslado",
  vista_causa: "Vista de causa",
  otras: "Otro trámite",
};

interface DocumentoGeneradoModalProps {
  resultado: GenerarCedulaResponse;
  onClose: () => void;
}

export default function DocumentoGeneradoModal({
  resultado,
  onClose,
}: DocumentoGeneradoModalProps) {
  const docLabel =
    resultado.interpretacion.tipo_documento === "carta_documento"
      ? "Carta documento"
      : TIPOS_ACTUACION_LABELS[
          resultado.interpretacion.tipo_documento as keyof typeof TIPOS_ACTUACION_LABELS
        ] ?? "Documento";

  const tramiteLabel =
    TRAMITE_LABELS[resultado.interpretacion.tipo_tramite] ??
    resultado.interpretacion.tipo_tramite;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="documento-generado-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6 md:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckIcon />
          </div>
          <h2
            id="documento-generado-title"
            className="text-xl font-semibold text-primary"
          >
            Archivo generado
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Tu {docLabel.toLowerCase()} está listo para descargar.
          </p>
        </div>

        <dl className="text-sm space-y-2 rounded-xl bg-background/80 border border-border p-4">
          <div>
            <dt className="text-muted">Trámite</dt>
            <dd className="font-medium">{tramiteLabel}</dd>
          </div>
          <div>
            <dt className="text-muted">Resumen</dt>
            <dd>{resultado.interpretacion.resumen}</dd>
          </div>
        </dl>

        {resultado.download_url && (
          <a
            href={resultado.download_url}
            className="inline-flex items-center justify-center w-full py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
          >
            Descargar{" "}
            {resultado.documentos_count === 1 ? "archivo" : "paquete"}
            {resultado.download_filename
              ? ` (${resultado.download_filename})`
              : ""}
          </a>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-sm font-medium text-muted hover:text-primary transition"
        >
          Generar otro documento
        </button>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
