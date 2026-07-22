import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CrearExpedienteForm } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("expedientes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as CrearExpedienteForm;

  if (!body.numero?.trim() || !body.jurisdiccion?.trim()) {
    return NextResponse.json(
      { error: "Número y jurisdicción son obligatorios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("expedientes")
    .insert({
      user_id: user.id,
      numero: body.numero.trim(),
      jurisdiccion: body.jurisdiccion.trim(),
      fuero: body.fuero?.trim() || null,
      caratula: body.caratula?.trim() || null,
    } as never)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya tenés ese expediente registrado" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
