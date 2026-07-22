"use client";

import Link from "next/link";
import type { ActuacionGeneradaResponse } from "@/lib/actuaciones/types";
import { TIPOS_ACTUACION_LABELS } from "@/lib/actuaciones/types";

interface ActuacionesResultadoProps {
  resultado: ActuacionGeneradaResponse;
  onRegenerar: () => void;
  expedienteId: string;
}

export default function ActuacionesResultado({
  resultado,
  onRegenerar,
  expedienteId,
}: ActuacionesResultadoProps) {
  const fecha = new Date(resultado.created_at).toLocaleString("es-AR");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/dashboard/expedientes"
          className="text-primary hover:underline"
        >
          ← Expedientes
        </Link>
        <span className="text-muted">/</span>
        <Link
          href={`/dashboard/expedientes/${expedienteId}/actuaciones`}
          className="text-primary hover:underline"
        >
          Actuaciones
        </Link>
      </div>

      <div className="bg-success/10 border border-success/30 rounded-xl p-6">
        <h1 className="text-xl font-bold text-primary mb-1">
          Paquete generado correctamente
        </h1>
        <p className="text-sm text-muted">
          {resultado.documentos_count} documento(s) listos para presentar.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold text-primary mb-4">Resumen</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted text-xs">Jurisdicción</dt>
            <dd className="font-medium">{resultado.jurisdiccion}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Plantilla aplicada</dt>
            <dd>{resultado.plantilla_nombre}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Tipo de actuación</dt>
            <dd>{TIPOS_ACTUACION_LABELS[resultado.tipo_actuacion]}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Documentos generados</dt>
            <dd>{resultado.documentos_count}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Resolución</dt>
            <dd>
              {new Date(resultado.resolucion.fecha).toLocaleDateString("es-AR")}
            </dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Fecha y hora</dt>
            <dd>{fecha}</dd>
          </div>
        </dl>
      </div>

      {resultado.destinatarios.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 overflow-x-auto">
          <h2 className="font-semibold text-primary mb-4">
            Documentos por destinatario
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 pr-4">Destinatario</th>
                <th className="pb-2 pr-4">Rol</th>
                <th className="pb-2">Archivos</th>
              </tr>
            </thead>
            <tbody>
              {resultado.destinatarios.map((d) => (
                <tr key={d.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-medium">
                    {d.apellido} {d.nombre}
                  </td>
                  <td className="py-2 pr-4 capitalize">{d.rol}</td>
                  <td className="py-2 text-xs text-muted">
                    {d.archivos.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={resultado.zip_url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition"
        >
          Descargar ZIP completo
        </a>
        <button
          type="button"
          onClick={onRegenerar}
          className="flex-1 py-3 border border-border rounded-xl font-medium hover:border-primary transition"
        >
          Regenerar
        </button>
      </div>
    </div>
  );
}
