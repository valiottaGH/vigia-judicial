/** Protege rutas del dashboard y APIs; redirige a /login si no hay sesion Supabase. */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  applySessionCookieOptions,
  isAbsoluteSessionExpired,
  SESSION_STARTED_COOKIE,
} from "@/lib/auth/session-config";

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (reason) url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_STARTED_COOKIE);
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              applySessionCookieOptions(options ?? {})
            )
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const startedRaw = request.cookies.get(SESSION_STARTED_COOKIE)?.value;
    const startedAt = startedRaw ? Number(startedRaw) : NaN;

    if (startedRaw && !Number.isNaN(startedAt) && isAbsoluteSessionExpired(startedAt)) {
      await supabase.auth.signOut();
      return redirectToLogin(request, "session_expired");
    }

    if (!startedRaw || Number.isNaN(startedAt)) {
      supabaseResponse.cookies.set(
        SESSION_STARTED_COOKIE,
        String(Date.now()),
        applySessionCookieOptions()
      );
    }
  }

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login/");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/onboarding") ||
    request.nextUrl.pathname.startsWith("/api/cedulas") ||
    request.nextUrl.pathname.startsWith("/api/actuaciones") ||
    request.nextUrl.pathname.startsWith("/api/profile") ||
    request.nextUrl.pathname.startsWith("/api/admin");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
