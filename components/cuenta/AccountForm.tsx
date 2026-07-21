"use client";

import { useState } from "react";
import type { AccountProfile } from "@/types";

export default function AccountForm({
  initial,
  email,
}: {
  initial: AccountProfile | null;
  email: string;
}) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    notifications_email: initial?.notifications_email ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/profile/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Error al guardar");
    } else {
      setMessage("Datos de cuenta actualizados.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          value={email}
          readOnly
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-muted"
        />
        <p className="text-xs text-muted mt-1">
          El email no se puede cambiar desde aqui. Contacta soporte si necesitas
          modificarlo.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre completo</label>
        <input
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.notifications_email}
          onChange={(e) =>
            setForm({ ...form, notifications_email: e.target.checked })
          }
          className="rounded border-border"
        />
        Recibir notificaciones por email
      </label>

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
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
