import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  applySessionCookieOptions,
  SESSION_STARTED_COOKIE,
} from "@/lib/auth/session-config";
import { getRequestOrigin, safeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  const origin = getRequestOrigin(request);
  const authError = searchParams.get("error_description") ?? searchParams.get("error");

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth");
    if (authError) loginUrl.searchParams.set("details", authError);
    return NextResponse.redirect(loginUrl);
  }

  const redirectTarget = new URL(next, origin);
  let response = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              applySessionCookieOptions(options ?? {})
            );
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "auth");
    return NextResponse.redirect(loginUrl);
  }

  response.cookies.set(
    SESSION_STARTED_COOKIE,
    String(Date.now()),
    applySessionCookieOptions()
  );

  return response;
}
