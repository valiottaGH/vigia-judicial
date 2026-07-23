"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DocumentoGeneradoModal from "@/components/cedulas/DocumentoGeneradoModal";
import FilePickerField from "@/components/files/FilePickerField";
import FileUploadToast from "@/components/files/FileUploadToast";
import {
  ADJUNTO_ACCEPT,
  INVALID_ADJUNTO_MESSAGE,
  isAllowedAdjuntoFile,
} from "@/lib/adjuntos/constants";
import type { GenerarCedulaResponse } from "@/lib/cedulas/types";
import { MEMBRETE_REQUIRED_MESSAGE } from "@/lib/profile/membrete";
import type { AiQuota } from "@/lib/subscription/entitlements";

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
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [resultado, setResultado] = useState<GenerarCedulaResponse | null>(
    null
  );
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

  async function handleSubmit(e: React.FormEvent) {
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

    setLoading(true);
    setError(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("numero", numero.trim());
    formData.append("caratula", caratula.trim());
    formData.append("file", archivos[0]);

    try {
      const res = await fetch("/api/cedulas/generar", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as GenerarCedulaResponse & {
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (data.code === "INVALID_FILE_TYPE") {
          showToast(data.error ?? INVALID_ADJUNTO_MESSAGE);
        }
        if (data.code === "MEMBRETE_INCOMPLETE") {
          setError(data.error ?? MEMBRETE_REQUIRED_MESSAGE);
          return;
        }
        if (data.code === "PLAN_LIMIT") {
          setError(data.error ?? "Alcanzaste el límite de tu plan este mes.");
          return;
        }
        setError(data.error ?? "Error al generar la cédula");
        return;
      }

      setResultado(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <FileUploadToast message={toast} onDismiss={() => setToast(null)} />

      {resultado && (
        <DocumentoGeneradoModal resultado={resultado} onClose={closeModal} />
      )}

      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          Generar cédula con IA
        </h1>
        <p className="text-sm text-muted mt-2 leading-relaxed">
          Cargá el proveído o notificación del juzgado. La IA interpreta qué
          pidieron (peritos, notificar partes, liquidación, etc.) y genera la
          cédula o carta documento con la respuesta.
        </p>
      </div>

      {!aiDisponible && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          Configurá{" "}
          <code className="text-xs">OPENROUTER_API_KEY</code> en{" "}
          <code className="text-xs">.env.local</code> para habilitar la
          generación automática.
        </div>
      )}

      {!membreteCompleto && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
          {MEMBRETE_REQUIRED_MESSAGE}{" "}
          <Link
            href="/dashboard/configuracion"
            className="text-primary font-medium hover:underline"
          >
            Completar membrete
          </Link>
        </div>
      )}

      {aiQuota.limit !== null && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            aiQuota.canGenerate
              ? "bg-background border-border text-muted"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          Plan {planNombre}: {aiQuota.usedThisMonth} / {aiQuota.limit}{" "}
          generaciones con IA este mes.
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
          Admin — generaciones sin límite ({aiQuota.usedThisMonth} este mes)
        </p>
      )}

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
            hint="Formatos aceptados: .pdf, .doc, .docx"
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
            loading || !aiDisponible || !membreteCompleto || !aiQuota.canGenerate
          }
          className="w-full py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Interpretando y generando…" : "Generar cédula con IA"}
        </button>
      </form>
    </div>
  );
}
