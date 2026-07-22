"use client";

import { useState } from "react";
import type { CrearExpedienteForm } from "@/types";
import { ADJUNTO_ACCEPT } from "@/lib/adjuntos/constants";

const JURISDICCIONES = [
  "Santa Fe",
  "CABA",
  "Buenos Aires",
  "Córdoba",
  "Mendoza",
  "Otra",
];

interface ExpedienteFormProps {
  onSuccess: () => void;
}

export default function ExpedienteForm({ onSuccess }: ExpedienteFormProps) {
  const [form, setForm] = useState<CrearExpedienteForm>({
    numero: "",
    jurisdiccion: "Santa Fe",
    fuero: "",
    caratula: "",
  });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subirAdjuntos(expedienteId: string, files: File[]) {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/expedientes/${expedienteId}/adjuntos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Error al subir ${file.name}`);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear expediente");
        return;
      }

      if (archivos.length > 0 && data.id) {
        try {
          await subirAdjuntos(data.id as string, archivos);
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? uploadErr.message
              : "Expediente creado pero falló la subida de archivos"
          );
          onSuccess();
          return;
        }
      }

      setForm({ numero: "", jurisdiccion: "Santa Fe", fuero: "", caratula: "" });
      setArchivos([]);
      onSuccess();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">
        Agregar expediente
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="numero" className="block text-sm font-medium mb-1">
            Número de expediente *
          </label>
          <input
            id="numero"
            value={form.numero}
            onChange={(e) => setForm({ ...form, numero: e.target.value })}
            required
            placeholder="Ej: 21 12156800 7"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label
            htmlFor="jurisdiccion"
            className="block text-sm font-medium mb-1"
          >
            Jurisdicción *
          </label>
          <select
            id="jurisdiccion"
            value={form.jurisdiccion}
            onChange={(e) =>
              setForm({ ...form, jurisdiccion: e.target.value })
            }
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {JURISDICCIONES.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="fuero" className="block text-sm font-medium mb-1">
            Fuero
          </label>
          <input
            id="fuero"
            value={form.fuero}
            onChange={(e) => setForm({ ...form, fuero: e.target.value })}
            placeholder="Ej: Civil, Comercial..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label htmlFor="caratula" className="block text-sm font-medium mb-1">
            Carátula
          </label>
          <input
            id="caratula"
            value={form.caratula}
            onChange={(e) => setForm({ ...form, caratula: e.target.value })}
            placeholder="Ej: Pérez c/ Gómez s/ Daños"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label htmlFor="adjuntos-nuevo" className="block text-sm font-medium mb-1">
            Archivos adjuntos (opcional)
          </label>
          <input
            id="adjuntos-nuevo"
            type="file"
            accept={ADJUNTO_ACCEPT}
            multiple
            onChange={(e) =>
              setArchivos(e.target.files ? Array.from(e.target.files) : [])
            }
            className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-sm file:bg-background"
          />
          <p className="text-xs text-muted mt-1">
            PDF o Word — máx. 15 MB por archivo
          </p>
          {archivos.length > 0 && (
            <ul className="mt-2 text-xs text-muted space-y-0.5">
              {archivos.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Agregar expediente"}
        </button>
      </form>
    </div>
  );
}
