"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FilePickerField from "@/components/files/FilePickerField";
import {
  ADJUNTO_ACCEPT,
  INVALID_ADJUNTO_MESSAGE,
  isAllowedAdjuntoFile,
  MAX_ADJUNTO_BYTES,
  maxAdjuntoSizeLabel,
  resolveAdjuntoMime,
} from "@/lib/adjuntos/constants";
import { uploadAdjuntoFromBrowser } from "@/lib/adjuntos/upload-client";
import { PLANTILLAS_SISTEMA } from "@/lib/analisis/plantillas-sistema";
import type { AnalisisPlantilla } from "@/lib/analisis/types";
import { parseJsonResponse } from "@/lib/api/parse-json-response";

interface NuevoAnalisisFormProps {
  plantillasPersonalizadas: AnalisisPlantilla[];
}

export default function NuevoAnalisisForm({
  plantillasPersonalizadas,
}: NuevoAnalisisFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [caratula, setCaratula] = useState("");
  const [plantillaKey, setPlantillaKey] = useState("general");
  const [plantillaId, setPlantillaId] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  const [nombrePlantilla, setNombrePlantilla] = useState("");
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";

    const validos: File[] = [];
    for (const file of incoming) {
      if (!isAllowedAdjuntoFile(file)) continue;
      if (file.size > MAX_ADJUNTO_BYTES) continue;
      validos.push(file);
    }

    if (validos.length < incoming.length) {
      setError(`Algunos archivos se omitieron (formato o tamaño máx. ${maxAdjuntoSizeLabel()}).`);
    } else {
      setError(null);
    }

    setArchivos((prev) => [...prev, ...validos]);
  }

  function removeFile(index: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !numero.trim() || !caratula.trim()) {
      setError("Completá nombre del análisis, número y carátula");
      return;
    }
    if (archivos.length === 0) {
      setError("Seleccioná al menos un documento");
      return;
    }

    setLoading(true);
    setError(null);
    setProgreso("Preparando subida…");

    try {
      const prepRes = await fetch("/api/analisis/preparar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: numero.trim(),
          caratula: caratula.trim(),
          archivos: archivos.map((f) => ({ fileName: f.name })),
        }),
      });

      const prep = await parseJsonResponse<{
        expedienteId?: string;
        uploads?: Array<{ adjuntoId: string; storagePath: string }>;
        error?: string;
      }>(prepRes);

      if (!prepRes.ok || !prep.expedienteId || !prep.uploads) {
        throw new Error(prep.error ?? "Error al preparar la subida");
      }

      const registros: Array<{
        id: string;
        storagePath: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
      }> = [];

      for (let i = 0; i < archivos.length; i++) {
        const file = archivos[i];
        const slot = prep.uploads[i];
        if (!slot) continue;

        setProgreso(`Subiendo ${i + 1} de ${archivos.length}: ${file.name}`);

        await uploadAdjuntoFromBrowser({
          storagePath: slot.storagePath,
          file,
        });

        registros.push({
          id: slot.adjuntoId,
          storagePath: slot.storagePath,
          fileName: file.name,
          fileSize: file.size,
          mimeType: resolveAdjuntoMime(file) ?? file.type,
        });
      }

      setProgreso("Registrando archivos…");

      const regRes = await fetch("/api/analisis/registrar-adjuntos", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expedienteId: prep.expedienteId,
          adjuntos: registros,
        }),
      });

      const reg = await parseJsonResponse<{ adjuntoIds?: string[]; error?: string }>(
        regRes
      );

      if (!regRes.ok || !reg.adjuntoIds) {
        throw new Error(reg.error ?? "Error al registrar adjuntos");
      }

      setProgreso("Analizando documentos con IA…");

      const createRes = await fetch("/api/analisis", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          expedienteId: prep.expedienteId,
          plantillaKey: plantillaId ? undefined : plantillaKey,
          plantillaId,
          adjuntoIds: reg.adjuntoIds,
          guardarPlantilla,
          nombrePlantilla: guardarPlantilla ? nombrePlantilla.trim() : undefined,
        }),
      });

      const created = await parseJsonResponse<{
        analisis?: { id: string };
        error?: string;
      }>(createRes);

      if (!createRes.ok || !created.analisis?.id) {
        throw new Error(created.error ?? "Error al analizar");
      }

      router.push(`/dashboard/analisis/${created.analisis.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
      setProgreso("");
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-5 shadow-sm"
    >
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium mb-1">
          Nombre del análisis *
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Ej: Revisión inicial causa Pérez"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="numero" className="block text-sm font-medium mb-1">
            Nº expediente *
          </label>
          <input
            id="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
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
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Plantilla *</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {PLANTILLAS_SISTEMA.map((p) => (
            <label
              key={p.key}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 ${
                !plantillaId && plantillaKey === p.key
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="plantilla"
                  checked={!plantillaId && plantillaKey === p.key}
                  onChange={() => {
                    setPlantillaKey(p.key);
                    setPlantillaId(null);
                  }}
                />
                <span className="text-sm font-semibold">{p.nombre}</span>
              </span>
              <span className="text-xs text-muted mt-1 pl-6">{p.descripcion}</span>
            </label>
          ))}
        </div>

        {plantillasPersonalizadas.length > 0 && (
          <div className="mt-3">
            <label className="block text-xs text-muted mb-1">
              Plantilla personalizada
            </label>
            <select
              value={plantillaId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setPlantillaId(v || null);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="">— Usar plantilla del sistema —</option>
              {plantillasPersonalizadas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium mb-1">
          Documentos de la causa *
        </span>
        <FilePickerField
          id="docs-analisis"
          inputRef={fileInputRef}
          accept={ADJUNTO_ACCEPT}
          multiple
          required
          files={archivos}
          onFilesSelected={handleFilesSelected}
          onRemove={removeFile}
          chooseLabel="Elegir documentos"
          addMoreLabel="Agregar más"
          hint={`PDF, DOC, DOCX — máx. ${maxAdjuntoSizeLabel()} c/u. Podés cargar muchos archivos.`}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={guardarPlantilla}
          onChange={(e) => setGuardarPlantilla(e.target.checked)}
        />
        Guardar campos como plantilla reutilizable
      </label>

      {guardarPlantilla && (
        <input
          value={nombrePlantilla}
          onChange={(e) => setNombrePlantilla(e.target.value)}
          placeholder="Nombre de la plantilla"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
        />
      )}

      {progreso && (
        <p className="text-sm text-primary font-medium">{progreso}</p>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "Procesando…" : "Iniciar análisis con IA"}
      </button>
    </form>
  );
}
