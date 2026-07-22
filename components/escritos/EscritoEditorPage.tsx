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
    <div className="max-w-4xl mx-auto space-y-4 pb-24 md:pb-0">
      <Link
        href="/dashboard/escritos"
        className="inline-block text-sm text-primary hover:underline"
      >
        ← Escritos
      </Link>

      {/* Acciones visibles en movil (barra fija abajo) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur-sm px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
          <a
            href={`/api/escritos/${escrito.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl bg-primary text-white text-xs font-medium"
          >
            <PdfIcon />
            Exportar PDF
          </a>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-border bg-background text-xs font-medium disabled:opacity-50"
          >
            <SaveIcon />
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl border border-red-200 text-danger text-xs font-medium"
          >
            <TrashIcon />
            Eliminar
          </button>
        </div>
      </div>

      {/* Acciones en desktop */}
      <div className="hidden md:flex flex-wrap gap-2 justify-end">
        <a
          href={`/api/escritos/${escrito.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
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

function PdfIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
