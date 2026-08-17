"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DocumentoAnalisis } from "@/lib/analisis/types";

interface AnalisisListPageProps {
  analisisInicial: DocumentoAnalisis[];
  aiDisponible: boolean;
}

function estadoBadge(estado: DocumentoAnalisis["estado"]) {
  const map = {
    borrador: "bg-gray-100 text-gray-700",
    procesando: "bg-amber-100 text-amber-800",
    completado: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-700",
  };
  const labels = {
    borrador: "Borrador",
    procesando: "Procesando…",
    completado: "Completado",
    error: "Error",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${map[estado]}`}>
      {labels[estado]}
    </span>
  );
}

export default function AnalisisListPage({
  analisisInicial,
  aiDisponible,
}: AnalisisListPageProps) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return analisisInicial;
    return analisisInicial.filter((a) => a.nombre.toLowerCase().includes(q));
  }, [analisisInicial, busqueda]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Análisis IA de documentos
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Revisá cientos de documentos en minutos. La IA completa una tabla con
          montos, fechas, partes y cláusulas — cada dato con cita al archivo
          original.
        </p>
      </div>

      {!aiDisponible && (
        <div className="p-4 rounded-xl bg-accent/25 border border-accent text-sm">
          Configurá <code className="text-xs">OPENROUTER_API_KEY</code> para
          habilitar el análisis con IA.
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 w-full">
        <Link
          href="/dashboard/configuracion#plantillas-cedula"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium border-2 border-primary/70 text-primary bg-white hover:bg-primary/5 shrink-0 whitespace-nowrap"
        >
          Agregar modelo de cédula
        </Link>
        <Link
          href="/dashboard/analisis/nuevo"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover shrink-0 whitespace-nowrap"
        >
          + Nuevo análisis
        </Link>
      </div>

      <input
        type="search"
        placeholder="Buscar análisis…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
      />

      {filtrados.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted">
          {analisisInicial.length === 0
            ? "Todavía no hay análisis. Creá uno para revisar documentos de una causa."
            : "No hay resultados para esa búsqueda."}
        </div>
      ) : (
        <ul className="divide-y divide-border bg-card border border-border rounded-xl overflow-hidden">
          {filtrados.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/analisis/${a.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background transition"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {a.nombre}
                  </p>
                  <p className="text-xs text-muted">
                    {a.adjunto_ids?.length ?? 0} documento(s) ·{" "}
                    {new Date(a.updated_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                {estadoBadge(a.estado)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
