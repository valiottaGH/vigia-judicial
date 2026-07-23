import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { applySessionCookieOptions } from "@/lib/auth/session-config";

type PendingCookie = { value: string; options?: Record<string, unknown> };

/** Cliente Supabase para Route Handlers con cookies en la respuesta (refresh de sesión). */
export function createSupabaseRouteClient(request: NextRequest) {
  const pendingCookies = new Map<string, PendingCookie>();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          for (const { name, value, options } of cookiesToSet) {
            pendingCookies.set(name, { value, options });
          }
        },
      },
    }
  );

  function withSessionCookies(response: NextResponse): NextResponse {
    for (const [name, { value, options }] of pendingCookies) {
      response.cookies.set(
        name,
        value,
        applySessionCookieOptions(options ?? {})
      );
    }
    return response;
  }

  async function getUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  return { supabase, withSessionCookies, getUser };
}
