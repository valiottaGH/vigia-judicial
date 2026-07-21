"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("Las contrasenas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Contrasena actualizada correctamente.");
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  }

  async function handleResetEmail() {
    setResetLoading(true);
    setMessage(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Enviamos un enlace de recuperacion a ${email}.`);
    }
    setResetLoading(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
        <p className="text-sm text-muted">
          Cambia tu contrasena mientras tenes la sesion iniciada.
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Nueva contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Confirmar contrasena
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Cambiar contrasena"}
        </button>
      </form>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted mb-2">
          O recibe un enlace por email para restablecer la contrasena.
        </p>
        <button
          type="button"
          onClick={() => void handleResetEmail()}
          disabled={resetLoading}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background disabled:opacity-50"
        >
          {resetLoading ? "Enviando..." : "Enviar enlace de recuperacion"}
        </button>
      </div>

      {message && (
        <p
          className={`text-sm ${message.includes("Error") || message.includes("debe") || message.includes("coinciden") ? "text-danger" : "text-success"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
