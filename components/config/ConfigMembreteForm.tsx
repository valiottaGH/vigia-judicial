"use client";

import { useState } from "react";
import type { MembreteProfile } from "@/types";

export default function ConfigMembreteForm({
  initial,
}: {
  initial: MembreteProfile | null;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    estudio_nombre: initial?.estudio_nombre ?? "",
    matricula: initial?.matricula ?? "",
    domicilio_profesional: initial?.domicilio_profesional ?? "",
    telefono: initial?.telefono ?? "",
    ciudad: initial?.ciudad ?? "Santa Fe",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      setMessage("Membrete guardado. Se usara en plantillas y PDF.");
    }
    setLoading(false);
  }

  const fields = [
    { key: "full_name", label: "Nombre completo (abogado/a)" },
    { key: "estudio_nombre", label: "Nombre del estudio" },
    { key: "matricula", label: "Matricula CPASF" },
    { key: "domicilio_profesional", label: "Domicilio profesional" },
    { key: "telefono", label: "Telefono" },
    { key: "ciudad", label: "Ciudad" },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <p className="text-sm text-muted">
        Estos datos aparecen en las plantillas de escritos y en el membrete del PDF.
      </p>

      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="block text-sm font-medium mb-1">{label}</label>
          <input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
      ))}

      {message && (
        <p className={`text-sm ${message.includes("Error") ? "text-danger" : "text-success"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar membrete"}
      </button>
    </form>
  );
}
