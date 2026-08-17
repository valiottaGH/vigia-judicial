"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VARIABLES_PLANTILLA_DOCX } from "@/lib/plantillas-cedula/constants";
import { uploadPlantillaFromBrowser } from "@/lib/plantillas-cedula/upload-client";
import type { PlantillaCedulaUsuario } from "@/lib/plantillas-cedula/types";

export default function ConfigPlantillasCedulaForm() {
  const [plantillas, setPlantillas] = useState<PlantillaCedulaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const cargarPlantillas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plantillas-cedula");
      const data = await res.json();
      if (res.ok) {
        setPlantillas(data.plantillas ?? []);
      } else {
        setMessage(data.error ?? "Error al cargar plantillas");
      }
    } catch {
      setMessage("Error de conexión al cargar plantillas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarPlantillas();
  }, [cargarPlantillas]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!nombre.trim()) {
      setMessage("Ingresá un nombre para la plantilla.");
      return;
    }
    if (!file) {
      setMessage("Seleccioná un archivo DOCX.");
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const prepRes = await fetch("/api/plantillas-cedula/preparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const prep = await prepRes.json();
      if (!prepRes.ok) {
        throw new Error(prep.error ?? "Error al preparar subida");
      }

      await uploadPlantillaFromBrowser({
        storagePath: prep.storagePath,
        file,
      });

      const regRes = await fetch("/api/plantillas-cedula/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantillaId: prep.plantillaId,
          storagePath: prep.storagePath,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          fileName: file.name,
          fileSize: file.size,
        }),
      });
      const reg = await regRes.json();
      if (!regRes.ok) {
        throw new Error(reg.error ?? "Error al registrar plantilla");
      }

      setNombre("");
      setDescripcion("");
      if (fileRef.current) fileRef.current.value = "";
      setMessage("Plantilla cargada. Ya podés usarla al generar un escrito.");
      await cargarPlantillas();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al subir plantilla");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta plantilla?")) return;

    setMessage(null);
    const res = await fetch(`/api/plantillas-cedula/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error al eliminar");
      return;
    }
    setMessage("Plantilla eliminada.");
    await cargarPlantillas();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Mis modelos de cédula
        </h2>
        <p className="text-sm text-muted mt-1">
          Subí tu plantilla DOCX con variables entre llaves (por ejemplo{" "}
          <code className="text-xs bg-background px-1 rounded">{`{destinatario}`}</code>
          ). Al generar un escrito, podrás elegirla en lugar del modelo provincial.
        </p>
      </div>

      <details className="text-sm border border-border rounded-lg p-3 bg-background">
        <summary className="cursor-pointer font-medium text-gray-900">
          Variables disponibles en la plantilla
        </summary>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 text-muted text-xs">
          {VARIABLES_PLANTILLA_DOCX.map((v) => (
            <li key={v.key}>
              <code className="text-gray-800">{`{${v.key}}`}</code> — {v.label}
            </li>
          ))}
        </ul>
      </details>

      <form onSubmit={handleUpload} className="space-y-4 border border-border rounded-xl p-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre de la plantilla *
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej.: Cédula Santa Fe — Estudio García"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Descripción (opcional)
          </label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej.: Modelo habitual para traslados"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Archivo DOCX *
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="w-full text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {uploading ? "Subiendo…" : "Subir plantilla"}
        </button>
      </form>

      {message && (
        <p
          className={`text-sm px-3 py-2 rounded-lg ${
            message.includes("Error") || message.includes("error")
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-green-50 text-green-800 border border-green-200"
          }`}
        >
          {message}
        </p>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Plantillas cargadas
        </h3>
        {loading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : plantillas.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no cargaste ninguna plantilla.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {plantillas.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 px-4 py-3 bg-white text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  {p.descripcion && (
                    <p className="text-muted text-xs mt-0.5">{p.descripcion}</p>
                  )}
                  <p className="text-muted text-xs mt-1">{p.nombre_archivo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(p.id)}
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
