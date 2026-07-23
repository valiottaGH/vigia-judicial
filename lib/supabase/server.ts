import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { applySessionCookieOptions } from "@/lib/auth/session-config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, applySessionCookieOptions(options ?? {}))
            );
          } catch {
            // setAll puede fallar en Server Components de solo lectura
          }
        },
      },
    }
  );
}
