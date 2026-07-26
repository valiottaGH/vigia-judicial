"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DocumentoGeneradoModal from "@/components/cedulas/DocumentoGeneradoModal";
import ConfirmacionEscritoForm, {
  respuestasIniciales,
} from "@/components/cedulas/ConfirmacionEscritoForm";
import FilePickerField from "@/components/files/FilePickerField";
import FileUploadToast from "@/components/files/FileUploadToast";
import {
  ADJUNTO_ACCEPT,
  INVALID_ADJUNTO_MESSAGE,
  isAllowedAdjuntoFile,
  MAX_ADJUNTO_BYTES,
  maxAdjuntoSizeLabel,
  resolveAdjuntoMime,
} from "@/lib/adjuntos/constants";
import { uploadAdjuntoFromBrowser } from "@/lib/adjuntos/upload-client";
import type { GenerarCedulaResponse } from "@/lib/cedulas/types";
import type {
  PreparacionEscrito,
  RespuestasEscrito,
} from "@/lib/cedulas/preparar-escrito";
import { parseJsonResponse } from "@/lib/api/parse-json-response";
import { MEMBRETE_REQUIRED_MESSAGE } from "@/lib/profile/membrete";
import type { AiQuota } from "@/lib/subscription/entitlements";
import { quotaUsageLabel } from "@/lib/subscription/entitlements";

interface GeneradorCedulasPageProps {
  aiDisponible: boolean;
  membreteCompleto: boolean;
  planNombre: string;
  aiQuota: AiQuota;
}

export default function GeneradorCedulasPage({
  aiDisponible,
  membreteCompleto,
  planNombre,
  aiQuota,
}: GeneradorCedulasPageProps) {
  const [numero, setNumero] = useState("");
  const [caratula, setCaratula] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [resultado, setResultado] = useState<GenerarCedulaResponse | null>(
    null
  );
  const [paso, setPaso] = useState<"formulario" | "confirmacion">("formulario");
  const [preparacion, setPreparacion] = useState<PreparacionEscrito | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestasEscrito>({});
  const [uploadMeta, setUploadMeta] = useState<{
    expedienteId: string;
    adjuntoId: string;
    storagePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 6000);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";

    if (incoming.length === 0) return;

    const file = incoming[0];

    if (!isAllowedAdjuntoFile(file)) {
      showToast(INVALID_ADJUNTO_MESSAGE);
      setArchivos([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_ADJUNTO_BYTES) {
      showToast(`El archivo supera ${maxAdjuntoSizeLabel()}.`);
      setArchivos([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setArchivos([file]);
    setError(null);
  }

  function removeFile() {
    setArchivos([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeModal() {
    setResultado(null);
  }

  async function handleAnalizar(e: React.FormEvent) {
    e.preventDefault();
    if (!numero.trim() || !caratula.trim()) {
      setError("Completá número y carátula del expediente");
      return;
    }
    if (archivos.length === 0) {
      setError("Cargá el proveído o notificación judicial");
      return;
    }
    if (!isAllowedAdjuntoFile(archivos[0])) {
      showToast(INVALID_ADJUNTO_MESSAGE);
      return;
    }
    if (!membreteCompleto) {
      setError(MEMBRETE_REQUIRED_MESSAGE);
      return;
    }

    setAnalizando(true);
    setError(null);
    setPreparacion(null);
    setUploadMeta(null);

    const file = archivos[0];
    const mimeType = resolveAdjuntoMime(file);
    if (!mimeType) {
      showToast(INVALID_ADJUNTO_MESSAGE);
      return;
    }

    try {
      const prepRes = await fetch("/api/cedulas/preparar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim(),
          caratula: caratula.trim(),
          fileName: file.name,
        }),
      });
      const prep = await parseJsonResponse<{
        expedienteId?: string;
        adjuntoId?: string;
        storagePath?: string;
        error?: string;
        code?: string;
      }>(prepRes);

      if (!prepRes.ok) {
        if (prep.code === "UNAUTHORIZED") {
          setError("Sesión expirada. Volvé a iniciar sesión.");
          return;
        }
        setError(prep.error ?? "Error al preparar la subida");
        return;
      }

      if (!prep.expedienteId || !prep.adjuntoId || !prep.storagePath) {
        setError("No se pudo preparar la subida del archivo");
        return;
      }

      await uploadAdjuntoFromBrowser({
        storagePath: prep.storagePath,
        file,
      });

      const meta = {
        expedienteId: prep.expedienteId,
        adjuntoId: prep.adjuntoId,
        storagePath: prep.storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType,
      };
      setUploadMeta(meta);

      const analizarRes = await fetch("/api/cedulas/preparar-escrito", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim(),
          caratula: caratula.trim(),
          ...meta,
        }),
      });

      const analizarData = await parseJsonResponse<{
        preparacion?: PreparacionEscrito;
        error?: string;
        code?: string;
      }>(analizarRes);

      if (!analizarRes.ok) {
        if (analizarData.code === "DOCUMENTO_NO_APTO") {
          setError(
            analizarData.error ??
              "El documento no corresponde a un trámite judicial."
          );
          return;
        }
        setError(analizarData.error ?? "Error al analizar el documento");
        return;
      }

      if (!analizarData.preparacion) {
        setError("No se pudo analizar el documento");
        return;
      }

      setPreparacion(analizarData.preparacion);
      setRespuestas(respuestasIniciales(analizarData.preparacion));
      setPaso("confirmacion");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error de conexión. Reintentá."
      );
    } finally {
      setAnalizando(false);
    }
  }

  async function handleGenerar() {
    if (!uploadMeta || !preparacion) return;

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch("/api/cedulas/generar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim(),
          caratula: caratula.trim(),
          respuestas,
          datos_preparados: preparacion.datos_extraidos,
          ...uploadMeta,
        }),
      });
      const data = await parseJsonResponse<
        GenerarCedulaResponse & { error?: string; code?: string }
      >(res);

      if (!res.ok) {
        if (data.code === "UNAUTHORIZED") {
          setError("Sesión expirada. Volvé a iniciar sesión.");
          return;
        }
        if (data.code === "INVALID_FILE_TYPE") {
          showToast(data.error ?? INVALID_ADJUNTO_MESSAGE);
          return;
        }
        if (data.code === "MEMBRETE_INCOMPLETE") {
          setError(data.error ?? MEMBRETE_REQUIRED_MESSAGE);
          return;
        }
        if (data.code === "PLAN_LIMIT") {
          setError(data.error ?? "Alcanzaste el límite de tu plan este mes.");
          return;
        }
        if (data.code === "DOCUMENTO_NO_APTO") {
          setError(data.error ?? "El documento no corresponde a un trámite judicial.");
          return;
        }
        setError(data.error ?? "Error al generar la cédula");
        return;
      }

      setResultado(data);
      setPaso("formulario");
      setPreparacion(null);
      setUploadMeta(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error de conexión. Reintentá."
      );
    } finally {
      setLoading(false);
    }
  }

  function volverAlFormulario() {
    setPaso("formulario");
    setPreparacion(null);
    setUploadMeta(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    await handleAnalizar(e);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <FileUploadToast message={toast} onDismiss={() => setToast(null)} />

      {resultado && (
        <DocumentoGeneradoModal resultado={resultado} onClose={closeModal} />
      )}

      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Generar cédula con IA
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Cargá el proveído o notificación del juzgado. La IA lo lee primero,
          te pide solo lo indispensable y genera un borrador impecable listo
          para presentar.
        </p>
      </div>

      {!aiDisponible && (
        <div className="p-4 rounded-xl bg-accent/25 border border-accent text-sm text-gray-900">
          Configurá{" "}
          <code className="text-xs">OPENROUTER_API_KEY</code> en{" "}
          <code className="text-xs">.env.local</code> para habilitar la
          generación automática.
        </div>
      )}

      {aiQuota.limit !== null && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            aiQuota.canGenerate
              ? "bg-surface border-border text-muted"
              : "bg-accent-light/40 border-accent text-gray-900"
          }`}
        >
          Plan {planNombre}: {aiQuota.used} / {aiQuota.limit}{" "}
          generaciones con IA {quotaUsageLabel(aiQuota.usagePeriod)}.
          {!aiQuota.canGenerate && (
            <>
              {" "}
              <Link
                href="/dashboard/cuenta?tab=suscripcion"
                className="text-primary font-medium hover:underline"
              >
                Mejorar plan
              </Link>
            </>
          )}
        </div>
      )}

      {aiQuota.limit === null && (
        <p className="text-center text-xs text-muted">
          Admin — generaciones sin límite ({aiQuota.used} este mes)
        </p>
      )}

      {paso === "confirmacion" && preparacion ? (
        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revisá antes de generar
          </h2>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-danger text-sm mb-4">
              {error}
            </div>
          )}
          <ConfirmacionEscritoForm
            preparacion={preparacion}
            respuestas={respuestas}
            onChange={setRespuestas}
            loading={loading}
            onConfirm={() => void handleGenerar()}
            onCancel={volverAlFormulario}
          />
        </div>
      ) : (
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-5 shadow-sm"
      >
        <div>
          <label htmlFor="numero" className="block text-sm font-medium mb-1">
            Número de expediente *
          </label>
          <input
            id="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
            placeholder="Ej: 21 12156800 7"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>

        <div>
          <label htmlFor="caratula" className="block text-sm font-medium mb-1">
            Carátula *
          </label>
          <input
            id="caratula"
            value={caratula}
            onChange={(e) => setCaratula(e.target.value)}
            required
            placeholder="Ej: Pérez c/ Gómez s/ Daños"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-1">
            Proveído / notificación judicial *
          </span>
          <FilePickerField
            id="proveido"
            inputRef={fileInputRef}
            accept={ADJUNTO_ACCEPT}
            multiple={false}
            required
            files={archivos}
            onFilesSelected={handleFilesSelected}
            onRemove={removeFile}
            chooseLabel="Elegir archivo"
            addMoreLabel="Cambiar archivo"
            hint={`Formatos: .pdf, .doc, .docx — máx. ${maxAdjuntoSizeLabel()}`}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={
            analizando || !aiDisponible || !membreteCompleto || !aiQuota.canGenerate
          }
          className="w-full py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {analizando ? "Leyendo documento…" : "Analizar documento"}
        </button>
      </form>
      )}
    </div>
  );
}
