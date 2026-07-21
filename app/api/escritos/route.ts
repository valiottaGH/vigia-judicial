import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CrearEscritoRequest } from "@/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("escritos")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ escritos: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as CrearEscritoRequest;

  if (!body.titulo?.trim() || !body.tipo?.trim()) {
    return NextResponse.json(
      { error: "Titulo y tipo son obligatorios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("escritos")
    .insert({
      user_id: user.id,
      titulo: body.titulo.trim(),
      tipo: body.tipo,
      contenido_html: body.contenido_html ?? "",
      variables: body.variables ?? {},
      expediente_id: body.expediente_id ?? null,
      estado: "borrador",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ escrito: data }, { status: 201 });
}
