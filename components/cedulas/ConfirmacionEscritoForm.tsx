"use client";

import Link from "next/link";
import { useMemo } from "react";
import DisclaimerGenerador from "@/components/cedulas/DisclaimerGenerador";
import { preguntasParaConfirmacion } from "@/lib/cedulas/preguntas-escrito";
import type {
  PreparacionEscrito,
  PreguntaEscrito,
  RespuestasEscrito,
} from "@/lib/cedulas/preparar-escrito";
import { preguntasPorCategoria } from "@/lib/cedulas/preparar-escrito";
import { labelDocumentoSolicitado } from "@/lib/cedulas/documento-solicitado";

interface ConfirmacionEscritoFormProps {
  preparacion: PreparacionEscrito;
  respuestas: RespuestasEscrito;
  onChange: (respuestas: RespuestasEscrito) => void;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function CampoPregunta({
  pregunta,
  value,
  onChange,
  hidden,
}: {
  pregunta: PreguntaEscrito;
  value: string;
  onChange: (value: string) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  const baseClass =
    "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (pregunta.tipo_campo === "select" && pregunta.opciones?.length) {
    return (
      <select
        id={`preg-${pregunta.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={pregunta.requerido}
        className={baseClass}
      >
        {pregunta.opciones.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    );
  }

  if (pregunta.tipo_campo === "textarea") {
    return (
      <textarea
        id={`preg-${pregunta.id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={pregunta.requerido}
        rows={3}
        placeholder={pregunta.valor_sugerido || pregunta.pregunta}
        className={baseClass}
      />
    );
  }

  return (
    <input
      id={`preg-${pregunta.id}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={pregunta.requerido}
      placeholder={pregunta.valor_sugerido || pregunta.pregunta}
      className={baseClass}
    />
  );
}

function SeccionPreguntas({
  titulo,
  descripcion,
  preguntas,
  respuestas,
  onChange,
}: {
  titulo: string;
  descripcion: string;
  preguntas: PreguntaEscrito[];
  respuestas: RespuestasEscrito;
  onChange: (respuestas: RespuestasEscrito) => void;
}) {
  if (preguntas.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
        <p className="text-xs text-muted mt-0.5">{descripcion}</p>
      </div>
      {preguntas.map((pregunta) => {
        const ocultarDetalleCopias =
          pregunta.id === "detalle_copias" &&
          respuestas.lleva_copias_adjuntas === "no";

        return (
          <div key={pregunta.id} className={ocultarDetalleCopias ? "hidden" : ""}>
            <label
              htmlFor={`preg-${pregunta.id}`}
              className="block text-sm font-medium mb-1"
            >
              {pregunta.label}
              {pregunta.requerido && !ocultarDetalleCopias && " *"}
            </label>
            {pregunta.motivo && (
              <p className="text-xs text-muted mb-1.5">{pregunta.motivo}</p>
            )}
            <CampoPregunta
              pregunta={pregunta}
              value={respuestas[pregunta.id] ?? pregunta.valor_sugerido}
              onChange={(v) => onChange({ ...respuestas, [pregunta.id]: v })}
              hidden={ocultarDetalleCopias}
            />
          </div>
        );
      })}
    </section>
  );
}

function esRequerida(
  pregunta: PreguntaEscrito,
  respuestas: RespuestasEscrito
): boolean {
  if (pregunta.id === "detalle_copias" && respuestas.lleva_copias_adjuntas === "no") {
    return false;
  }
  return pregunta.requerido;
}

export default function ConfirmacionEscritoForm({
  preparacion,
  respuestas,
  onChange,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmacionEscritoFormProps) {
  const preguntasActivas = useMemo(
    () =>
      preguntasParaConfirmacion({
        preparacion,
        respuestas,
      }),
    [preparacion, respuestas]
  );

  const estrategicas = preguntasPorCategoria(preguntasActivas, "estrategico");
  const logisticas = preguntasPorCategoria(preguntasActivas, "logistica");
  const { perfil, datos_extraidos: datos } = preparacion;

  const faltanRequeridos = preguntasActivas.some(
    (p) => esRequerida(p, respuestas) && !respuestas[p.id]?.trim()
  );

  const transcripcion =
    datos.transcripcion_auto?.trim() || datos.texto_proveido?.trim();

  return (
    <div className="space-y-6">
      {preparacion.lectura && preparacion.lectura.modo !== "completo" && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
          {preparacion.lectura.mensaje}
        </div>
      )}

      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
        <p className="font-medium text-primary mb-1">Lo que dice el expediente</p>
        <p className="text-gray-800 leading-relaxed">{preparacion.resumen}</p>
        {preparacion.tipo_documento_sugerido && (
          <p className="text-xs text-muted mt-2">
            Sugerencia de la IA:{" "}
            {labelDocumentoSolicitado(preparacion.tipo_documento_sugerido)}
          </p>
        )}
      </div>

      <div className="p-4 rounded-xl bg-background border border-border text-sm space-y-3">
        <p className="font-semibold text-gray-900">Datos extraídos por la IA</p>

        {datos.juzgado && (
          <p>
            <span className="font-medium text-gray-900">Juzgado:</span>{" "}
            {datos.juzgado}
          </p>
        )}

        {(datos.caratula || datos.numero_expediente) && (
          <p>
            <span className="font-medium text-gray-900">Carátula / expediente:</span>{" "}
            {datos.numero_expediente ? `Nº ${datos.numero_expediente} — ` : ""}
            {datos.caratula ?? ""}
          </p>
        )}

        {datos.parte_a_notificar && (
          <p>
            <span className="font-medium text-gray-900">Parte a notificar:</span>{" "}
            {datos.parte_a_notificar}
          </p>
        )}

        {transcripcion && (
          <div>
            <p className="font-medium text-gray-900 mb-1">
              Transcripción del auto / resolución
            </p>
            <p className="text-muted text-xs leading-relaxed whitespace-pre-wrap border-l-2 border-primary/30 pl-3">
              {transcripcion}
            </p>
          </div>
        )}

        {datos.partes && datos.partes.length > 0 && (
          <div>
            <p className="font-medium text-gray-900 mb-1">Partes en el proveído</p>
            <ul className="list-disc pl-5 space-y-0.5 text-muted">
              {datos.partes.map((p, i) => (
                <li key={`${p.apellido}-${p.nombre}-${i}`}>
                  {p.apellido} {p.nombre}
                  {p.rol ? ` (${p.rol})` : ""}
                  {p.domicilio ? ` — ${p.domicilio}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <SeccionPreguntas
        titulo="1. Estrategia y fondo"
        descripcion="Lo que vos decidís: objetivo del escrito, argumentos e instrucciones concretas."
        preguntas={estrategicas}
        respuestas={respuestas}
        onChange={onChange}
      />

      <SeccionPreguntas
        titulo="2. Logística"
        descripcion="Jurisdicción, domicilio de notificación, copias adjuntas o datos de la entidad destinataria."
        preguntas={logisticas}
        respuestas={respuestas}
        onChange={onChange}
      />

      {logisticas.some((p) => p.id === "jurisdiccion_plantilla") && (
        <p className="text-xs text-muted -mt-2">
          ¿Querés usar tu propio modelo Word?{" "}
          <Link href="/dashboard/configuracion" className="text-primary hover:underline">
            Cargalo en Configuración
          </Link>{" "}
          y aparecerá como &quot;Mi modelo: …&quot; en el selector de arriba.
        </p>
      )}

      <section className="p-4 rounded-xl bg-background border border-border text-sm space-y-2">
        <h3 className="font-semibold text-gray-900">3. Firma y matriculación</h3>
        <p className="text-xs text-muted">
          Se toma de tu perfil — no hace falta cargarlo en cada escrito.{" "}
          <Link href="/dashboard/configuracion" className="text-primary hover:underline">
            Editar en Configuración
          </Link>
        </p>
        <ul className="text-muted space-y-0.5">
          {perfil.nombre && (
            <li>
              <span className="text-gray-900">Letrado:</span> {perfil.nombre}
              {perfil.caracter ? ` (${perfil.caracter})` : ""}
            </li>
          )}
          {perfil.matricula && (
            <li>
              <span className="text-gray-900">Matrícula:</span> {perfil.matricula}
            </li>
          )}
          {perfil.cuit_cuil && (
            <li>
              <span className="text-gray-900">CUIT/CUIL:</span> {perfil.cuit_cuil}
            </li>
          )}
          {perfil.domicilio_electronico && (
            <li>
              <span className="text-gray-900">Domicilio electrónico:</span>{" "}
              {perfil.domicilio_electronico}
            </li>
          )}
          {perfil.domicilio_profesional && (
            <li>
              <span className="text-gray-900">Domicilio profesional:</span>{" "}
              {perfil.domicilio_profesional}
            </li>
          )}
        </ul>
        {!perfil.completo && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Completá nombre y matrícula en Configuración para un membrete correcto.
          </p>
        )}
      </section>

      <DisclaimerGenerador className="mb-2" />

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || faltanRequeridos}
          className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "Generando borrador…" : "Generar escrito"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-3 border border-border rounded-lg text-sm hover:bg-background disabled:opacity-50"
        >
          Volver
        </button>
      </div>
    </div>
  );
}

export function respuestasIniciales(
  preparacion: PreparacionEscrito
): RespuestasEscrito {
  const map: RespuestasEscrito = {};
  for (const p of preparacion.preguntas) {
    map[p.id] = p.valor_sugerido;
  }
  return map;
}
