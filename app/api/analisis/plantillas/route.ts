import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import type { CampoExtraccion } from "@/lib/analisis/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("analisis_plantillas")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ plantillas: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    nombre?: string;
    campos?: CampoExtraccion[];
  };

  const nombre = body.nombre?.trim();
  const campos = body.campos ?? [];

  if (!nombre || campos.length === 0) {
    return json({ error: "Nombre y campos obligatorios" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("analisis_plantillas")
    .insert({
      user_id: user.id,
      nombre,
      campos: campos as never,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    return json({ error: error?.message ?? "Error al guardar" }, { status: 500 });
  }

  return json({ plantilla: data }, { status: 201 });
}
