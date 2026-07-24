import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import type { DocumentoAnalisis } from "@/lib/analisis/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("documento_analisis")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return json({ error: "Análisis no encontrado" }, { status: 404 });
  }

  return json({ analisis: data as DocumentoAnalisis });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase
    .from("documento_analisis")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ ok: true });
}
