"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadPlantillaFromBrowser } from "@/lib/plantillas-cedula/upload-client";
import {
  LABEL_CAMPO_PLANTILLA,
  type AnalisisPlantillaCedula,
  type PlantillaCedulaUsuario,
} from "@/lib/plantillas-cedula/types";

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
      setMessage("Ingresá un nombre para identificar este modelo.");
      return;
    }
    if (!file) {
      setMessage("Seleccioná una cédula de ejemplo en Word (.docx).");
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

      setMessage("Analizando tu cédula con IA…");

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
        throw new Error(reg.error ?? "Error al analizar la cédula");
      }

      const analisis = reg.analisis as AnalisisPlantillaCedula | undefined;
      const campos = analisis?.campos_detectados?.length ?? 0;

      setNombre("");
      setDescripcion("");
      if (fileRef.current) fileRef.current.value = "";
      setMessage(
        campos > 0
          ? `Listo. Detectamos ${campos} dato(s) variable(s) en tu cédula. Ya podés usarla al generar un escrito.`
          : "Cédula cargada. Ya podés usarla al generar un escrito."
      );
      await cargarPlantillas();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al subir la cédula");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este modelo de cédula?")) return;

    setMessage(null);
    const res = await fetch(`/api/plantillas-cedula/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error al eliminar");
      return;
    }
    setMessage("Modelo eliminado.");
    await cargarPlantillas();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Mis modelos de cédula
        </h2>
        <p className="text-sm text-muted mt-1">
          Subí una cédula que ya hayas usado en un caso real. La IA aprende tu
          formato y lo reutiliza al generar nuevos escritos.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-4 border border-border rounded-xl p-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del modelo *
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej.: Cédula traslado — Estudio García"
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
            placeholder="Ej.: La que uso habitualmente en traslados"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Cédula de ejemplo (Word .docx) *
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="w-full text-sm"
            required
          />
          <p className="text-xs text-muted mt-1.5">
            Una cédula ya completada de un caso anterior, en Word (.docx).
          </p>
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {uploading ? "Analizando cédula…" : "Subir cédula de ejemplo"}
        </button>
      </form>

      {message && (
        <p
          className={`text-sm px-3 py-2 rounded-lg ${
            message.toLowerCase().includes("error") ||
            message.includes("No pudimos")
              ? "bg-red-50 text-red-800 border border-red-200"
              : message.includes("Analizando")
                ? "bg-amber-50 text-amber-900 border border-amber-200"
                : "bg-green-50 text-green-800 border border-green-200"
          }`}
        >
          {message}
        </p>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Modelos cargados
        </h3>
        {loading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : plantillas.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no cargaste ningún modelo. Subí una cédula de ejemplo arriba.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {plantillas.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 px-4 py-3 bg-white text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  {p.descripcion && (
                    <p className="text-muted text-xs mt-0.5">{p.descripcion}</p>
                  )}
                  {p.analisis_ia?.campos_detectados &&
                    p.analisis_ia.campos_detectados.length > 0 && (
                      <p className="text-xs text-muted mt-1.5">
                        IA detectó:{" "}
                        {p.analisis_ia.campos_detectados
                          .map((c) => LABEL_CAMPO_PLANTILLA[c] ?? c)
                          .join(", ")}
                      </p>
                    )}
                  {!p.analisis_ia && (
                    <p className="text-xs text-amber-700 mt-1">
                      Sin análisis — volvé a subirla
                    </p>
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
