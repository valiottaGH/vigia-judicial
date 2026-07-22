"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADJUNTO_ACCEPT,
  formatAdjuntoSize,
} from "@/lib/adjuntos/constants";
import type { ExpedienteAdjunto } from "@/lib/adjuntos/types";

interface AdjuntosPanelProps {
  expedienteId: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  compact?: boolean;
}

export default function AdjuntosPanel({
  expedienteId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  compact = false,
}: AdjuntosPanelProps) {
  const [adjuntos, setAdjuntos] = useState<ExpedienteAdjunto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialSelectDone = useRef(false);

  const loadAdjuntos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expedientes/${expedienteId}/adjuntos`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al cargar adjuntos");
        return;
      }
      const list = (data.adjuntos ?? []) as ExpedienteAdjunto[];
      setAdjuntos(list);
      if (
        selectable &&
        onSelectionChange &&
        !initialSelectDone.current &&
        list.length > 0
      ) {
        initialSelectDone.current = true;
        onSelectionChange(list.map((a) => a.id));
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [expedienteId, selectable, onSelectionChange]);

  useEffect(() => {
    initialSelectDone.current = false;
    loadAdjuntos();
  }, [expedienteId, loadAdjuntos]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/expedientes/${expedienteId}/adjuntos`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `Error al subir ${file.name}`);
          break;
        }
        const nuevo = data.adjunto as ExpedienteAdjunto;
        setAdjuntos((prev) => [nuevo, ...prev]);
        if (selectable && onSelectionChange) {
          onSelectionChange([...selectedIds, nuevo.id]);
        }
      } catch {
        setError(`Error de conexión al subir ${file.name}`);
        break;
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDownload(adjuntoId: string) {
    const res = await fetch(
      `/api/expedientes/${expedienteId}/adjuntos/${adjuntoId}`
    );
    const data = await res.json();
    if (res.ok && data.download_url) {
      window.open(data.download_url, "_blank", "noopener,noreferrer");
    } else {
      setError(data.error ?? "No se pudo descargar");
    }
  }

  async function handleDelete(adjuntoId: string) {
    if (!confirm("¿Eliminar este archivo?")) return;

    const res = await fetch(
      `/api/expedientes/${expedienteId}/adjuntos/${adjuntoId}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al eliminar");
      return;
    }
    setAdjuntos((prev) => prev.filter((a) => a.id !== adjuntoId));
    if (selectable && onSelectionChange) {
      onSelectionChange(selectedIds.filter((id) => id !== adjuntoId));
    }
  }

  function toggleSelect(id: string) {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <p className="text-xs text-muted">
          PDF o Word (.pdf, .doc, .docx) — máx. 15 MB por archivo
        </p>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ADJUNTO_ACCEPT}
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id={`adjuntos-input-${expedienteId}`}
        />
        <label
          htmlFor={`adjuntos-input-${expedienteId}`}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-lg cursor-pointer hover:border-primary transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {uploading ? "Subiendo…" : "+ Adjuntar PDF o Word"}
        </label>
        {selectable && adjuntos.length > 0 && onSelectionChange && (
          <>
            <button
              type="button"
              onClick={() => onSelectionChange(adjuntos.map((a) => a.id))}
              className="text-xs px-2 py-1 border border-border rounded-full hover:border-primary"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={() => onSelectionChange([])}
              className="text-xs px-2 py-1 border border-border rounded-full hover:border-primary"
            >
              Ninguno
            </button>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted">Cargando archivos…</p>
      ) : adjuntos.length === 0 ? (
        <p className="text-xs text-muted">Sin archivos adjuntos.</p>
      ) : (
        <ul className="space-y-2">
          {adjuntos.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 p-2 border border-border rounded-lg text-sm"
            >
              {selectable && onSelectionChange && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(a.id)}
                  onChange={() => toggleSelect(a.id)}
                  className="w-4 h-4 accent-primary shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs truncate">{a.nombre_original}</p>
                <p className="text-[10px] text-muted">
                  {formatAdjuntoSize(a.tamano_bytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(a.id)}
                className="text-xs text-primary hover:underline shrink-0"
              >
                Descargar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="text-xs text-danger hover:underline shrink-0"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
