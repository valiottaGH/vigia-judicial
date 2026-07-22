"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ActuacionesResultado from "./ActuacionesResultado";
import AdjuntosPanel from "@/components/adjuntos/AdjuntosPanel";
import type {
  ActuacionGeneradaResponse,
  ExpedienteActuaciones,
  ParteExpediente,
  Resolucion,
  RolParte,
  TipoActuacion,
} from "@/lib/actuaciones/types";
import {
  TIPOS_ACTUACION,
  TIPOS_ACTUACION_LABELS,
} from "@/lib/actuaciones/types";

interface ActuacionesGeneradorPageProps {
  expediente: ExpedienteActuaciones;
  partesIniciales: ParteExpediente[];
  resolucionesIniciales: Resolucion[];
}

const ROL_LABELS: Record<RolParte, string> = {
  actor: "Actor",
  demandado: "Demandado",
  tercero: "Tercero",
  organismo: "Organismo",
};

export default function ActuacionesGeneradorPage({
  expediente,
  partesIniciales,
  resolucionesIniciales,
}: ActuacionesGeneradorPageProps) {
  const router = useRouter();
  const [partes, setPartes] = useState(partesIniciales);
  const [resoluciones, setResoluciones] = useState(resolucionesIniciales);
  const [resolucionId, setResolucionId] = useState(
    resolucionesIniciales[0]?.id ?? ""
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tipoActuacion, setTipoActuacion] = useState<TipoActuacion>("cedula");
  const [instruccion, setInstruccion] = useState("");
  const [selectedAdjuntoIds, setSelectedAdjuntoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ActuacionGeneradaResponse | null>(
    null
  );

  const [showAddParte, setShowAddParte] = useState(false);
  const [showAddResolucion, setShowAddResolucion] = useState(false);
  const [nuevaParte, setNuevaParte] = useState({
    nombre: "",
    apellido: "",
    rol: "demandado" as RolParte,
    domicilio: "",
  });
  const [nuevaResolucion, setNuevaResolucion] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    texto: "",
  });

  const allSelected =
    partes.length > 0 && selectedIds.length === partes.length;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(partes.map((p) => p.id));
    }
  }

  function toggleParte(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectDemandados() {
    setSelectedIds(partes.filter((p) => p.rol === "demandado").map((p) => p.id));
  }

  async function agregarParte(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/expedientes/${expediente.id}/actuaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "parte", parte: nuevaParte }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al agregar parte");
      return;
    }
    setPartes((prev) => [...prev, data.parte]);
    setNuevaParte({ nombre: "", apellido: "", rol: "demandado", domicilio: "" });
    setShowAddParte(false);
    router.refresh();
  }

  async function agregarResolucion(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/expedientes/${expediente.id}/actuaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "resolucion", resolucion: nuevaResolucion }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al agregar resolución");
      return;
    }
    setResoluciones((prev) => [data.resolucion, ...prev]);
    setResolucionId(data.resolucion.id);
    setNuevaResolucion({
      fecha: new Date().toISOString().slice(0, 10),
      texto: "",
    });
    setShowAddResolucion(false);
    router.refresh();
  }

  async function generarPaquete() {
    setError(null);
    setLoading(true);
    setResultado(null);

    try {
      const res = await fetch("/api/actuaciones/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expediente_id: expediente.id,
          resolucion_id: resolucionId,
          destinatario_ids: selectedIds,
          tipo_actuacion: tipoActuacion,
          instruccion: instruccion.trim() || undefined,
          adjunto_ids:
            selectedAdjuntoIds.length > 0 ? selectedAdjuntoIds : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al generar el paquete");
        return;
      }

      setResultado(data as ActuacionGeneradaResponse);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function regenerar() {
    setResultado(null);
    setError(null);
  }

  if (resultado) {
    return (
      <ActuacionesResultado
        resultado={resultado}
        onRegenerar={regenerar}
        expedienteId={expediente.id}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/dashboard/expedientes"
          className="text-primary hover:underline"
        >
          ← Expedientes
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h1 className="text-xl font-bold text-primary mb-1">
          Generación masiva de actuaciones
        </h1>
        <p className="text-sm text-muted mb-4">
          Generá cédulas, oficios y documentos judiciales según la jurisdicción
          del expediente.
        </p>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted text-xs">Carátula</dt>
            <dd className="font-medium">{expediente.caratula ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Expediente Nº</dt>
            <dd className="font-medium">{expediente.numero}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Juzgado</dt>
            <dd>{expediente.juzgado ?? expediente.fuero ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted text-xs">Jurisdicción</dt>
            <dd className="font-medium text-primary">{expediente.jurisdiccion}</dd>
          </div>
        </dl>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Resoluciones */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-primary">Resolución del expediente</h2>
          <button
            type="button"
            onClick={() => setShowAddResolucion(!showAddResolucion)}
            className="text-sm text-primary hover:underline"
          >
            + Agregar resolución
          </button>
        </div>

        {showAddResolucion && (
          <form onSubmit={agregarResolucion} className="mb-4 p-4 bg-background rounded-lg space-y-3">
            <input
              type="date"
              value={nuevaResolucion.fecha}
              onChange={(e) =>
                setNuevaResolucion((r) => ({ ...r, fecha: e.target.value }))
              }
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              required
            />
            <textarea
              value={nuevaResolucion.texto}
              onChange={(e) =>
                setNuevaResolucion((r) => ({ ...r, texto: e.target.value }))
              }
              placeholder="Texto del proveído o resolución..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px]"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
              Guardar resolución
            </button>
          </form>
        )}

        {resoluciones.length === 0 ? (
          <p className="text-sm text-muted">
            No hay resoluciones cargadas. Agregá una para continuar.
          </p>
        ) : (
          <select
            value={resolucionId}
            onChange={(e) => setResolucionId(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          >
            {resoluciones.map((r) => (
              <option key={r.id} value={r.id}>
                {new Date(r.fecha).toLocaleDateString("es-AR")} —{" "}
                {r.texto.slice(0, 80)}
                {r.texto.length > 80 ? "…" : ""}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* Destinatarios */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-primary">Destinatarios</h2>
          <button
            type="button"
            onClick={() => setShowAddParte(!showAddParte)}
            className="text-sm text-primary hover:underline"
          >
            + Agregar parte
          </button>
        </div>

        {showAddParte && (
          <form onSubmit={agregarParte} className="mb-4 p-4 bg-background rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Apellido"
              value={nuevaParte.apellido}
              onChange={(e) =>
                setNuevaParte((p) => ({ ...p, apellido: e.target.value }))
              }
              className="border border-border rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Nombre"
              value={nuevaParte.nombre}
              onChange={(e) =>
                setNuevaParte((p) => ({ ...p, nombre: e.target.value }))
              }
              className="border border-border rounded-lg px-3 py-2 text-sm"
              required
            />
            <select
              value={nuevaParte.rol}
              onChange={(e) =>
                setNuevaParte((p) => ({
                  ...p,
                  rol: e.target.value as RolParte,
                }))
              }
              className="border border-border rounded-lg px-3 py-2 text-sm"
            >
              {(Object.keys(ROL_LABELS) as RolParte[]).map((rol) => (
                <option key={rol} value={rol}>
                  {ROL_LABELS[rol]}
                </option>
              ))}
            </select>
            <input
              placeholder="Domicilio"
              value={nuevaParte.domicilio}
              onChange={(e) =>
                setNuevaParte((p) => ({ ...p, domicilio: e.target.value }))
              }
              className="border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="sm:col-span-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
              Guardar parte
            </button>
          </form>
        )}

        {partes.length === 0 ? (
          <p className="text-sm text-muted">
            No hay partes cargadas. Agregá demandados u otras partes para
            generar documentos.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs px-3 py-1 border border-border rounded-full hover:border-primary"
              >
                {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
              </button>
              <button
                type="button"
                onClick={selectDemandados}
                className="text-xs px-3 py-1 border border-border rounded-full hover:border-primary"
              >
                Todos los demandados
              </button>
            </div>
            <ul className="space-y-2">
              {partes.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleParte(p.id)}
                    className="w-4 h-4 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {p.apellido} {p.nombre}
                    </p>
                    <p className="text-xs text-muted">
                      {ROL_LABELS[p.rol]}
                      {p.domicilio ? ` · ${p.domicilio}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Archivos adjuntos */}
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-semibold text-primary mb-2">Archivos adjuntos</h2>
        <p className="text-sm text-muted mb-4">
          Subí PDF o Word del expediente. Los seleccionados se incluirán en la
          carpeta <code className="text-xs">adjuntos/</code> del ZIP generado.
        </p>
        <AdjuntosPanel
          expedienteId={expediente.id}
          selectable
          selectedIds={selectedAdjuntoIds}
          onSelectionChange={setSelectedAdjuntoIds}
        />
      </section>

      {/* Configuración de generación */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-primary">Configuración</h2>

        <div>
          <label className="block text-xs text-muted mb-1">
            Tipo de actuación
          </label>
          <select
            value={tipoActuacion}
            onChange={(e) =>
              setTipoActuacion(e.target.value as TipoActuacion)
            }
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          >
            {TIPOS_ACTUACION.filter((t) => t !== "escrito_acompanamiento").map(
              (t) => (
                <option key={t} value={t}>
                  {TIPOS_ACTUACION_LABELS[t]}
                </option>
              )
            )}
          </select>
          <p className="text-xs text-muted mt-1">
            El escrito de acompañamiento se genera automáticamente con el
            paquete.
          </p>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">
            Instrucción del abogado (lenguaje natural)
          </label>
          <textarea
            value={instruccion}
            onChange={(e) => setInstruccion(e.target.value)}
            placeholder='Ej: "Generar cédulas para notificar el proveído del 22/07/2026 a todos los demandados"'
            className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px]"
          />
          <p className="text-xs text-muted mt-1">
            La instrucción puede ajustar tipo y destinatarios automáticamente.
          </p>
        </div>

        <button
          type="button"
          onClick={generarPaquete}
          disabled={
            loading ||
            !resolucionId ||
            selectedIds.length === 0 ||
            tipoActuacion === "escrito_acompanamiento"
          }
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Generando paquete judicial…" : "Generar paquete judicial"}
        </button>
      </section>
    </div>
  );
}
