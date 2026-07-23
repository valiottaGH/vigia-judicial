"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/auth/session-config";
import { createClient } from "@/lib/supabase/client";

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let lastActivity = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function expireSession() {
      await supabase.auth.signOut();
      router.push("/login?reason=session_expired");
      router.refresh();
    }

    function resetIdleTimer() {
      lastActivity = Date.now();
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (Date.now() - lastActivity >= SESSION_IDLE_TIMEOUT_MS) {
          void expireSession();
        }
      }, SESSION_IDLE_TIMEOUT_MS);
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((event) =>
      window.addEventListener(event, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, [router]);

  return <>{children}</>;
}
