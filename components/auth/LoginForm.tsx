"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLogo from "@/components/layout/AppLogo";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

function authErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Este email ya esta registrado. Inicia sesion o usa Google.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Email o contrasena incorrectos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirma tu email antes de iniciar sesion (revisa spam).";
  }
  return raw;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const sessionExpired = searchParams.get("reason") === "session_expired";
  const signupMode = searchParams.get("mode") === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSignUp, setIsSignUp] = useState(signupMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "auth" ? "No se pudo completar el inicio de sesion. Intenta de nuevo." : null
  );
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (signupMode) setIsSignUp(true);
  }, [signupMode]);

  useEffect(() => {
    let cancelled = false;
    const client = createClient();

    void client.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) return;
      router.replace(redirect.startsWith("/") ? redirect : "/dashboard");
      router.refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [redirect, router]);

  function resetFormErrors() {
    setError(null);
    setMessage(null);
  }

  function switchMode(signUp: boolean) {
    setIsSignUp(signUp);
    setPasswordConfirm("");
    resetFormErrors();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    resetFormErrors();

    const callbackUrl = buildAuthCallbackUrl(window.location.origin, redirect);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: { prompt: "select_account" },
      },
    });

    if (oauthError) {
      setError(authErrorMessage(oauthError.message));
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    resetFormErrors();

    if (isSignUp) {
      if (password !== passwordConfirm) {
        setError("Las contrasenas no coinciden.");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("La contrasena debe tener al menos 8 caracteres.");
        setLoading(false);
        return;
      }

      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const checkData = (await checkRes.json()) as { taken?: boolean; error?: string };

      if (!checkRes.ok) {
        setError(checkData.error ?? "No se pudo verificar el email.");
        setLoading(false);
        return;
      }

      if (checkData.taken) {
        setError("Este email ya esta registrado. Inicia sesion o usa Google.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(window.location.origin, redirect),
        },
      });

      if (signUpError) {
        setError(authErrorMessage(signUpError.message));
      } else if (data.session) {
        router.push(redirect);
        router.refresh();
      } else {
        setMessage(
          "Cuenta creada. Revisa tu email para confirmar (o desactiva Confirm email en Supabase si es solo prueba)."
        );
        setPasswordConfirm("");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(authErrorMessage(signInError.message));
      } else {
        router.push(redirect);
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <AppLogo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Fast Cedu</h1>
          <p className="text-muted mt-2">
            {isSignUp ? "Crea tu cuenta" : "Inicia sesion en tu cuenta"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-5">
          {sessionExpired && !error && (
            <div className="p-3 rounded-lg bg-accent/30 border border-accent text-gray-900 text-sm">
              Tu sesion expiro por inactividad o tiempo maximo. Inicia sesion de nuevo.
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-danger text-sm">{error}</div>
          )}
          {message && (
            <div className="p-3 rounded-lg bg-accent/25 border border-accent text-success text-sm">{message}</div>
          )}

          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={googleLoading || loading}
            className="w-full py-3 border border-border rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-background transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted uppercase">o con email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
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
                autoComplete="email"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="abogado@estudio.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 8 : 6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="********"
              />
              {isSignUp && (
                <p className="text-xs text-muted mt-1">Minimo 8 caracteres.</p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="block text-sm font-medium mb-1"
                >
                  Repetir contrasena
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    passwordConfirm && password !== passwordConfirm
                      ? "border-red-300"
                      : "border-border"
                  }`}
                  placeholder="********"
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <p className="text-xs text-danger mt-1">Las contrasenas no coinciden.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading
                ? "Procesando..."
                : isSignUp
                  ? "Registrarse"
                  : "Iniciar sesion"}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            {isSignUp ? "Ya tenes cuenta?" : "No tenes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(!isSignUp)}
              className="text-primary font-medium hover:underline"
            >
              {isSignUp ? "Inicia sesion" : "Registrate"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
