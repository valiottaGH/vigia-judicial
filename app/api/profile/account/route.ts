import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActualizarCuentaRequest } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, notifications_email, plan, subscription_status, subscription_ends_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data, email: user.email });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as ActualizarCuentaRequest;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: body.full_name,
      notifications_email: body.notifications_email,
    } as never)
    .eq("id", user.id)
    .select(
      "full_name, notifications_email, plan, subscription_status, subscription_ends_at"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ account: data });
}
