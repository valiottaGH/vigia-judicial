"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PLANES,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/subscription/plans";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan: PlanId;
  plan_nombre: string;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  is_admin: boolean;
  created_at: string;
}

const STATUS_OPTIONS: SubscriptionStatus[] = [
  "active",
  "trialing",
  "canceled",
  "past_due",
  "none",
];

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = (await res.json()) as { users?: AdminUser[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al cargar usuarios");
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function saveUser(user: AdminUser) {
    setSavingId(user.id);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: user.plan,
          subscription_status: user.subscription_status,
          is_admin: user.is_admin,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setMessage(`Actualizado: ${user.email}`);
      await loadUsers();
    } catch {
      setError("Error de conexion");
    } finally {
      setSavingId(null);
    }
  }

  function updateUser(id: string, patch: Partial<AdminUser>) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  }

  if (loading) {
    return <p className="text-sm text-muted">Cargando usuarios...</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">{error}</div>
      )}
      {message && (
        <div className="p-3 rounded-lg bg-accent/25 border border-accent text-success text-sm">
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Nombre</th>
              <th className="text-left p-3 font-medium">Plan</th>
              <th className="text-left p-3 font-medium">Estado</th>
              <th className="text-left p-3 font-medium">Admin</th>
              <th className="text-left p-3 font-medium">Alta</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="p-3 align-top">
                  <span className="font-medium">{user.email}</span>
                </td>
                <td className="p-3 align-top text-muted">
                  {user.full_name || "—"}
                </td>
                <td className="p-3 align-top">
                  <select
                    value={user.plan}
                    onChange={(e) =>
                      updateUser(user.id, {
                        plan: e.target.value as PlanId,
                      })
                    }
                    className="w-full min-w-[7rem] px-2 py-1.5 border border-border rounded-lg bg-card"
                  >
                    {PLANES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 align-top">
                  <select
                    value={user.subscription_status}
                    onChange={(e) =>
                      updateUser(user.id, {
                        subscription_status: e.target.value as SubscriptionStatus,
                      })
                    }
                    className="w-full min-w-[7rem] px-2 py-1.5 border border-border rounded-lg bg-card"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 align-top">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={user.is_admin}
                      onChange={(e) =>
                        updateUser(user.id, { is_admin: e.target.checked })
                      }
                      className="rounded border-border"
                    />
                    <span className="text-xs text-muted">Admin</span>
                  </label>
                </td>
                <td className="p-3 align-top text-xs text-muted whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString("es-AR")}
                </td>
                <td className="p-3 align-top">
                  <button
                    type="button"
                    onClick={() => void saveUser(user)}
                    disabled={savingId === user.id}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    {savingId === user.id ? "Guardando…" : "Guardar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-sm text-muted">No hay usuarios registrados.</p>
      )}
    </div>
  );
}
