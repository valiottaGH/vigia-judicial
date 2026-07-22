import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ActualizarEscritoRequest } from "@/types";
import type { Database, Json } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };
type EscritoUpdate = Database["public"]["Tables"]["escritos"]["Update"];

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
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
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Escrito no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ escrito: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as ActualizarEscritoRequest;

  const patch: EscritoUpdate = {
    ...(body.titulo !== undefined ? { titulo: body.titulo } : {}),
    ...(body.contenido_html !== undefined ? { contenido_html: body.contenido_html } : {}),
    ...(body.estado !== undefined ? { estado: body.estado } : {}),
    ...(body.variables !== undefined
      ? { variables: body.variables as Json }
      : {}),
  };

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("escritos")
    .update(patch as never)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Escrito no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ escrito: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("escritos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
