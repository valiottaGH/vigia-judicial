"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/auth/redirect";

/**
 * Página intermedia post-OAuth: evita que el middleware llegue a /dashboard
 * antes de que el navegador aplique las cookies de sesión (doble login en prod).
 */
function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirectPath(searchParams.get("next"));
  const [message, setMessage] = useState("Iniciando sesión…");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function finishLogin() {
      for (let attempt = 0; attempt < 8; attempt++) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session && !error) {
          router.replace(next);
          router.refresh();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      setMessage("No se pudo iniciar sesión. Redirigiendo…");
      router.replace("/login?error=auth");
    }

    void finishLogin();

    return () => {
      cancelled = true;
    };
  }, [next, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-muted">{message}</p>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4">
          <p className="text-sm text-muted">Iniciando sesión…</p>
        </main>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
