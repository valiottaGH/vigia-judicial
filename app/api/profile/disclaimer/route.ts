import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const acceptedAt = new Date().toISOString();

  // Guardar en metadata del usuario (funciona sin migracion SQL)
  const { error: metaError } = await supabase.auth.updateUser({
    data: { disclaimer_accepted_at: acceptedAt },
  });

  if (metaError) {
    return NextResponse.json({ error: metaError.message }, { status: 500 });
  }

  // Intentar guardar en profiles si la columna existe
  try {
    const admin = createServiceClient();
    await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? "",
        disclaimer_accepted_at: acceptedAt,
      } as never,
      { onConflict: "id" }
    );
  } catch {
    // OK si falla (ej. migracion 002 no ejecutada)
  }

  return NextResponse.json({ ok: true, accepted_at: acceptedAt });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const metaAccepted = user.user_metadata?.disclaimer_accepted_at as
    | string
    | undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select("disclaimer_accepted_at, notifications_email")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    disclaimer_accepted_at:
      profile?.disclaimer_accepted_at ?? metaAccepted ?? null,
    notifications_email: profile?.notifications_email ?? true,
  });
}
