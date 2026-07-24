import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const rate = await checkRateLimit({
    key: rateLimitKey("auth/check-email", request),
    limit: 10,
    windowSeconds: 900,
  });
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds ?? 900);
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("is_email_registered", {
      check_email: email,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ taken: Boolean(data) });
  } catch {
    return NextResponse.json({ error: "Error al verificar email" }, { status: 500 });
  }
}
