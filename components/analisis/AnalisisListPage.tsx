"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  AnalisisPlantilla,
  DocumentoAnalisis,
  PlantillaSistema,
} from "@/lib/analisis/types";

interface AnalisisListPageProps {
  analisisInicial: DocumentoAnalisis[];
  aiDisponible: boolean;
  plantillasSistema: PlantillaSistema[];
  plantillasPersonalizadas: AnalisisPlantilla[];
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
  plantillasSistema,
  plantillasPersonalizadas,
}: AnalisisListPageProps) {
  const [tab, setTab] = useState<"analisis" | "plantillas">("analisis");
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("analisis")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "analisis"
                ? "bg-primary text-white"
                : "bg-card text-muted hover:bg-background"
            }`}
          >
            Análisis
          </button>
          <button
            type="button"
            onClick={() => setTab("plantillas")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "plantillas"
                ? "bg-primary text-white"
                : "bg-card text-muted hover:bg-background"
            }`}
          >
            Plantillas
          </button>
        </div>

        {tab === "analisis" && (
          <Link
            href="/dashboard/analisis/nuevo"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover"
          >
            + Nuevo análisis
          </Link>
        )}
      </div>

      {tab === "analisis" ? (
        <>
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
        </>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-primary mb-3">
              Plantillas del sistema
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {plantillasSistema.map((p) => (
                <li
                  key={p.key}
                  className="border border-border rounded-xl p-4 bg-card"
                >
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-xs text-muted mt-1">{p.descripcion}</p>
                  <p className="text-xs text-muted mt-2">
                    {p.campos.length} campos
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {plantillasPersonalizadas.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-primary mb-3">
                Tus plantillas
              </h2>
              <ul className="divide-y divide-border bg-card border border-border rounded-xl">
                {plantillasPersonalizadas.map((p) => (
                  <li
                    key={p.id}
                    className="px-4 py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm">{p.nombre}</p>
                      <p className="text-xs text-muted">
                        {(p.campos as unknown[]).length} campos
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
