"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import EscritoEditor from "./EscritoEditor";
import GenerarConIaPanel from "./GenerarConIaPanel";
import type { Escrito } from "@/types";

export default function EscritoEditorPage({ escrito }: { escrito: Escrito }) {
  const [titulo, setTitulo] = useState(escrito.titulo);
  const [contenido, setContenido] = useState(escrito.contenido_html);
  const [estado, setEstado] = useState(escrito.estado);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/escritos/${escrito.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, contenido_html: contenido, estado }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error al guardar");
    } else {
      setMessage("Guardado");
      setDirty(false);
    }
    setSaving(false);
  }, [escrito.id, titulo, contenido, estado]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      void save();
    }, 2000);
    return () => clearTimeout(t);
  }, [dirty, titulo, contenido, estado, save]);

  async function handleDelete() {
    if (!confirm("Eliminar este escrito?")) return;
    await fetch(`/api/escritos/${escrito.id}`, { method: "DELETE" });
    window.location.href = "/dashboard/escritos";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <Link
          href="/dashboard/escritos"
          className="text-sm text-primary hover:underline"
        >
          ← Escritos
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/escritos/${escrito.id}/pdf`}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-background"
          >
            Exportar PDF
          </a>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm text-danger border border-red-200 rounded-lg"
          >
            Eliminar
          </button>
        </div>
      </div>

      <input
        value={titulo}
        onChange={(e) => {
          setTitulo(e.target.value);
          setDirty(true);
        }}
        className="w-full text-2xl font-bold text-primary bg-transparent border-none focus:outline-none focus:ring-0"
      />

      <div className="flex items-center gap-3 text-sm">
        <label className="text-muted">Estado:</label>
        <select
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as Escrito["estado"]);
            setDirty(true);
          }}
          className="px-2 py-1 border border-border rounded-lg"
        >
          <option value="borrador">Borrador</option>
          <option value="finalizado">Finalizado</option>
        </select>
        {message && <span className="text-muted">{message}</span>}
      </div>

      <GenerarConIaPanel
        tipo={escrito.tipo}
        compact
        onGenerated={(html) => {
          setContenido(html);
          setDirty(true);
          setMessage("Contenido generado — revisa y guarda");
        }}
      />

      <EscritoEditor
        content={contenido}
        onChange={(html) => {
          setContenido(html);
          setDirty(true);
        }}
      />

      <p className="text-xs text-muted">
        Los campos entre corchetes (ej. [Caratula]) son placeholders para completar.
        Configura tu membrete en Configuracion para el PDF.
      </p>
    </div>
  );
}
