"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DocumentoGeneradoModal from "@/components/cedulas/DocumentoGeneradoModal";
import {
  DOCUMENTOS_SOLICITADOS,
  type DocumentoSolicitado,
} from "@/lib/cedulas/documento-solicitado";
import { camposDesdePlantilla, getPlantillaSistema } from "@/lib/analisis/plantillas-sistema";
import { labelTipoTramite } from "@/lib/analisis/tramite-detectado";
import type { CampoExtraccion, CeldaAnalisis, DocumentoAnalisis } from "@/lib/analisis/types";
import { parseJsonResponse } from "@/lib/api/parse-json-response";
import type { GenerarCedulaResponse } from "@/lib/cedulas/types";

interface AnalisisDetallePageProps {
  analisis: DocumentoAnalisis;
}

export default function AnalisisDetallePage({
  analisis: initial,
}: AnalisisDetallePageProps) {
  const [analisis, setAnalisis] = useState(initial);
  const [celdaActiva, setCeldaActiva] = useState<{
    filaIdx: number;
    campoId: string;
    celda: CeldaAnalisis;
  } | null>(null);
  const [filaSeleccionada, setFilaSeleccionada] = useState<string | null>(
    analisis.adjunto_ids?.[0] ?? null
  );
  const [tipoDocumento, setTipoDocumento] = useState<DocumentoSolicitado>("cedula");
  const [loading, setLoading] = useState(false);
  const [reanalizando, setReanalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generado, setGenerado] = useState<GenerarCedulaResponse | null>(null);

  const campos = camposDesdePlantilla({
    plantillaKey: analisis.plantilla_key,
    plantillaCampos: analisis.campos as CampoExtraccion[],
  });

  const plantillaNombre =
    getPlantillaSistema(analisis.plantilla_key)?.nombre ?? "Análisis general";

  const resultadoData = analisis.resultado;

  const filaActiva = useMemo(
    () => resultadoData?.filas.find((f) => f.adjunto_id === filaSeleccionada),
    [resultadoData?.filas, filaSeleccionada]
  );

  const tramiteActivo = filaActiva?.tramite;
  const puedeGenerarEscrito =
    tramiteActivo?.requiere_escrito === true ||
    (tramiteActivo === undefined && Boolean(filaSeleccionada));

  useEffect(() => {
    const sugerido = filaActiva?.tramite?.tipo_documento_sugerido;
    if (sugerido) {
      setTipoDocumento(sugerido);
    }
  }, [filaActiva?.adjunto_id, filaActiva?.tramite?.tipo_documento_sugerido]);

  async function reanalizar() {
    setReanalizando(true);
    setError(null);
    try {
      const res = await fetch(`/api/analisis/${analisis.id}/ejecutar`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await parseJsonResponse<{ analisis?: DocumentoAnalisis; error?: string }>(
        res
      );
      if (!res.ok || !data.analisis) {
        throw new Error(data.error ?? "Error al reanalizar");
      }
      setAnalisis(data.analisis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setReanalizando(false);
    }
  }

  async function eliminar() {
    if (!confirm("¿Eliminar este análisis?")) return;
    const res = await fetch(`/api/analisis/${analisis.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (res.ok) {
      window.location.href = "/dashboard/analisis";
    }
  }

  async function generarEscrito() {
    if (!filaSeleccionada) {
      setError("Seleccioná una fila de la tabla (documento base)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/analisis/${analisis.id}/generar-escrito`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adjuntoId: filaSeleccionada,
            tipo_documento: tipoDocumento,
          }),
        }
      );

      const data = await parseJsonResponse<
        GenerarCedulaResponse & { error?: string; code?: string }
      >(res);

      if (!res.ok) {
        throw new Error(data.error ?? "Error al generar escrito");
      }

      setGenerado({
        interpretacion: data.interpretacion!,
        expediente_id: data.expediente_id ?? "",
        actuacion_id: data.actuacion_id,
        download_url: data.download_url,
        download_filename: data.download_filename,
        documentos_count: data.documentos_count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {generado?.download_url && (
        <DocumentoGeneradoModal
          resultado={generado}
          onClose={() => setGenerado(null)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{analisis.nombre}</h1>
          <p className="text-sm text-muted mt-1">
            Tipo: {plantillaNombre} · {analisis.adjunto_ids?.length ?? 0}{" "}
            documento(s) ·{" "}
            <span
              className={
                analisis.estado === "completado"
                  ? "text-green-700"
                  : analisis.estado === "error"
                    ? "text-red-600"
                    : "text-amber-700"
              }
            >
              {analisis.estado}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void reanalizar()}
            disabled={reanalizando || analisis.estado === "procesando"}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-50"
          >
            {reanalizando ? "Reanalizando…" : "Reanalizar"}
          </button>
          <button
            type="button"
            onClick={() => void eliminar()}
            className="px-3 py-1.5 text-sm text-danger border border-red-200 rounded-lg hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {analisis.estado === "procesando" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
          Analizando documentos… Esta página se actualizará al terminar.
        </div>
      )}

      {analisis.error_mensaje && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {analisis.error_mensaje}
        </div>
      )}

      {resultadoData?.resumen && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
          <p className="font-medium text-primary mb-1">Resumen del lote</p>
          <p className="text-gray-800 leading-relaxed">{resultadoData.resumen}</p>
        </div>
      )}

      {resultadoData?.lectura_errores && resultadoData.lectura_errores.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm">
          <p className="font-medium mb-1">Advertencias</p>
          <ul className="list-disc pl-5 space-y-1">
            {resultadoData.lectura_errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {resultadoData?.filas && resultadoData.filas.length > 0 && (
        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-background/80">
                <th className="text-left p-3 font-medium w-8" />
                <th className="text-left p-3 font-medium">Documento</th>
                <th className="text-left p-3 font-medium whitespace-nowrap">
                  Trámite detectado
                </th>
                {campos.map((c) => (
                  <th key={c.id} className="text-left p-3 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultadoData.filas.map((fila, filaIdx) => (
                <tr
                  key={fila.adjunto_id}
                  className={`border-b border-border last:border-0 ${
                    filaSeleccionada === fila.adjunto_id ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="p-3">
                    <input
                      type="radio"
                      name="fila_base"
                      checked={filaSeleccionada === fila.adjunto_id}
                      onChange={() => setFilaSeleccionada(fila.adjunto_id)}
                      title="Usar este documento como base para generar escrito"
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-900 max-w-[180px] truncate">
                    {fila.documento}
                  </td>
                  <td className="p-3 align-top max-w-[200px]">
                    {fila.tramite ? (
                      fila.tramite.requiere_escrito ? (
                        <span className="text-green-800">
                          {labelTipoTramite(fila.tramite.tipo_tramite)}
                          {fila.tramite.tipo_documento_sugerido && (
                            <span className="block text-xs text-muted mt-0.5">
                              → {fila.tramite.tipo_documento_sugerido}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted text-xs leading-snug">
                          Sin escrito
                        </span>
                      )
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  {campos.map((campo) => {
                    const celda = fila.celdas[campo.id] ?? {
                      valor: "—",
                      cita: "",
                    };
                    const activa =
                      celdaActiva?.filaIdx === filaIdx &&
                      celdaActiva?.campoId === campo.id;

                    return (
                      <td key={campo.id} className="p-3 align-top">
                        <button
                          type="button"
                          onClick={() =>
                            setCeldaActiva(
                              activa
                                ? null
                                : { filaIdx, campoId: campo.id, celda }
                            )
                          }
                          className="text-left w-full hover:bg-background rounded p-1 -m-1 transition"
                        >
                          <span className="line-clamp-3">{celda.valor}</span>
                          {celda.cita && (
                            <span className="block text-xs text-primary mt-0.5">
                              Ver cita
                            </span>
                          )}
                        </button>
                        {activa && celda.cita && (
                          <blockquote className="mt-2 text-xs text-muted border-l-2 border-primary pl-2 italic">
                            «{celda.cita}»
                          </blockquote>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analisis.estado === "completado" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Generar escrito desde el análisis
          </h2>

          {!filaSeleccionada && (
            <p className="text-sm text-muted">
              Seleccioná un documento en la tabla (radio) para ver si corresponde
              generar un escrito.
            </p>
          )}

          {filaSeleccionada && tramiteActivo && !puedeGenerarEscrito && (
            <div className="p-4 rounded-xl bg-background border border-border text-sm space-y-1">
              <p className="font-medium text-gray-900">
                No hay escrito ni respuesta procesal que realizar
              </p>
              <p className="text-muted leading-relaxed">
                {tramiteActivo.motivo_sin_escrito ??
                  "Este documento no implica una acción del letrado según el análisis de la IA."}
              </p>
              <p className="text-xs text-muted pt-1">
                Probá seleccionando otro documento del lote que sí contenga un
                proveído o notificación judicial.
              </p>
            </div>
          )}

          {filaSeleccionada && puedeGenerarEscrito && (
            <>
              {tramiteActivo?.descripcion && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-sm">
                  <p className="font-medium text-primary">Trámite detectado</p>
                  <p className="text-gray-800 mt-1">{tramiteActivo.descripcion}</p>
                </div>
              )}

              <p className="text-sm text-muted">
                La IA sugiere el tipo de escrito según el documento. Podés
                cambiarlo antes de generar.
              </p>

              <div className="grid gap-2 sm:grid-cols-3">
                {DOCUMENTOS_SOLICITADOS.map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                      tipoDocumento === doc.id
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_escrito"
                      value={doc.id}
                      checked={tipoDocumento === doc.id}
                      onChange={() => setTipoDocumento(doc.id)}
                    />
                    <span className="text-sm font-medium">{doc.label}</span>
                  </label>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => void generarEscrito()}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Generando escrito…" : "Generar escrito con IA"}
              </button>
            </>
          )}
        </div>
      )}

      <Link
        href="/dashboard/analisis"
        className="inline-block text-sm text-primary hover:underline"
      >
        ← Volver al listado
      </Link>
    </div>
  );
}
