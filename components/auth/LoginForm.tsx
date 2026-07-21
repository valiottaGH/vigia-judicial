"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        router.push(redirect);
        router.refresh();
      } else {
        setMessage(
          "Te enviamos un email de confirmacion desde Supabase (no Resend). " +
            "Revisa spam. Si no llega, desactiva Confirm email en Supabase -> Authentication -> Sign In / Providers -> Email."
        );
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        router.push(redirect);
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Vigia Judicial</h1>
          <p className="text-muted mt-2">
            {isSignUp ? "Crea tu cuenta" : "Inicia sesion en tu cuenta"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-lg bg-green-50 text-success text-sm">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="abogado@estudio.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : isSignUp
                ? "Registrarse"
                : "Iniciar sesion"}
          </button>

          <p className="text-center text-sm text-muted">
            {isSignUp ? "Ya tenes cuenta?" : "No tenes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Inicia sesion" : "Registrate"}
            </button>
          </p>

          {isSignUp && (
            <p className="text-xs text-muted border-t border-border pt-4">
              El email de registro lo envia Supabase, no Resend. Las alertas de
              novedades usan Resend una vez que estes en el dashboard.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
