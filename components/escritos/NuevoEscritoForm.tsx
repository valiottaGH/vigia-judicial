"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GenerarConIaPanel from "./GenerarConIaPanel";
import {
  PLANTILLAS_ESCRITOS,
  aplicarVariables,
  variablesDesdePerfil,
  getPlantilla,
} from "@/lib/escritos/plantillas";
import type { MembreteProfile } from "@/types";

export default function NuevoEscritoForm({
  membrete,
}: {
  membrete: MembreteProfile | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS_ESCRITOS[0].id);
  const [contenidoIa, setContenidoIa] = useState<string | null>(null);
  const [modo, setModo] = useState<"plantilla" | "ia">("plantilla");

  const variables = variablesDesdePerfil(membrete ?? {});

  async function crearEscrito(contenido_html: string) {
    const plantilla = getPlantilla(plantillaId)!;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/escritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: titulo.trim() || plantilla.nombre,
        tipo: plantilla.id,
        contenido_html,
        variables,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear escrito");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/escritos/${data.escrito.id}`);
  }

  async function handleCreatePlantilla(e: React.FormEvent) {
    e.preventDefault();
    const plantilla = getPlantilla(plantillaId);
    if (!plantilla) return;
    await crearEscrito(aplicarVariables(plantilla.contenido, variables));
  }

  async function handleCreateIa(e: React.FormEvent) {
    e.preventDefault();
    if (!contenidoIa) {
      setError("Genera el borrador con IA primero");
      return;
    }
    await crearEscrito(contenidoIa);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 text-danger text-sm rounded-lg">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Titulo del escrito</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej: Escrito de traslado"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tipo de escrito</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANTILLAS_ESCRITOS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPlantillaId(p.id);
                setContenidoIa(null);
              }}
              className={`text-left p-4 rounded-xl border transition ${
                plantillaId === p.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <span className="text-xs text-muted uppercase">{p.categoria}</span>
              <p className="font-medium text-primary mt-1">{p.nombre}</p>
              <p className="text-sm text-muted mt-1">{p.descripcion}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setModo("plantilla")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            modo === "plantilla" ? "bg-primary text-white" : "text-muted"
          }`}
        >
          Plantilla fija
        </button>
        <button
          type="button"
          onClick={() => setModo("ia")}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            modo === "ia" ? "bg-primary text-white" : "text-muted"
          }`}
        >
          Generar con IA
        </button>
      </div>

      {modo === "plantilla" ? (
        <form onSubmit={(e) => void handleCreatePlantilla(e)} className="space-y-4">
          <p className="text-sm text-muted">
            Crea un borrador con placeholders ([Caratula], etc.) para completar a mano.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear escrito"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void handleCreateIa(e)} className="space-y-4">
          <GenerarConIaPanel
            tipo={plantillaId}
            variables={variables}
            onGenerated={(html) => {
              setContenidoIa(html);
              setError(null);
            }}
          />
          {contenidoIa && (
            <p className="text-sm text-success">Borrador listo. Podes crear el escrito.</p>
          )}
          <button
            type="submit"
            disabled={loading || !contenidoIa}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear escrito con borrador IA"}
          </button>
        </form>
      )}
    </div>
  );
}
