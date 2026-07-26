"use client";

import { useState } from "react";
import type { MembreteProfile } from "@/types";

const CARACTER_OPCIONES = [
  { value: "", label: "— Seleccionar —" },
  { value: "propio", label: "Por derecho propio" },
  { value: "apoderado", label: "Apoderado/a" },
  { value: "patrocinante", label: "Patrocinante" },
] as const;

export default function ConfigMembreteForm({
  initial,
}: {
  initial: MembreteProfile | null;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    estudio_nombre: initial?.estudio_nombre ?? "",
    matricula: initial?.matricula ?? "",
    matricula_tomo: initial?.matricula_tomo ?? "",
    matricula_folio: initial?.matricula_folio ?? "",
    cuit_cuil: initial?.cuit_cuil ?? "",
    caracter: initial?.caracter ?? "",
    domicilio_electronico: initial?.domicilio_electronico ?? "",
    domicilio_profesional: initial?.domicilio_profesional ?? "",
    telefono: initial?.telefono ?? "",
    ciudad: initial?.ciudad ?? "Santa Fe",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.matricula.trim()) {
      setMessage("Completá nombre y matrícula.");
      return;
    }
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/profile/membrete", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error al guardar");
    } else {
      setMessage("Perfil guardado. Se usará en todos los escritos.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <p className="text-sm text-muted">
        Estos datos se usan en el membrete de cada escrito. Solo nombre y
        matrícula son obligatorios.
      </p>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">
          Identificación profesional
        </legend>
        {(
          [
            { key: "full_name", label: "Nombre completo (abogado/a) *" },
            { key: "estudio_nombre", label: "Nombre del estudio (opcional)" },
            { key: "matricula", label: "Matrícula CPASF *" },
            { key: "matricula_tomo", label: "Tomo (opcional)" },
            { key: "matricula_folio", label: "Folio (opcional)" },
            { key: "cuit_cuil", label: "CUIT/CUIL" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key === "full_name" || key === "matricula"}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1">
            Carácter en que actúa
          </label>
          <select
            value={form.caracter}
            onChange={(e) => setForm({ ...form, caracter: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          >
            {CARACTER_OPCIONES.map((op) => (
              <option key={op.value || "empty"} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-900">
          Domicilios y contacto
        </legend>
        {(
          [
            { key: "domicilio_profesional", label: "Domicilio profesional" },
            { key: "domicilio_electronico", label: "Domicilio electrónico / casillero" },
            { key: "telefono", label: "Teléfono" },
            { key: "ciudad", label: "Ciudad" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
        ))}
      </fieldset>

      {message && (
        <p
          className={`text-sm ${message.includes("Error") ? "text-danger" : "text-success"}`}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
