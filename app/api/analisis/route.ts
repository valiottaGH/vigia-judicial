import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";
import { camposDesdePlantilla } from "@/lib/analisis/plantillas-sistema";
import { ejecutarAnalisisDocumentos } from "@/lib/analisis/run-analysis";
import type { DocumentoAnalisis } from "@/lib/analisis/types";
import {
  checkRateLimit,
  rateLimitKey,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const maxDuration = 300;
export const runtime = "nodejs";

interface CreateAnalisisBody {
  nombre?: string;
  expedienteId?: string;
  plantillaKey?: string;
  adjuntoIds?: string[];
}

export async function GET(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();

  const { data, error } = await supabase
    .from("documento_analisis")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  let items = (data ?? []) as DocumentoAnalisis[];
  if (q) {
    items = items.filter((a) => a.nombre.toLowerCase().includes(q));
  }

  return json({ analisis: items, ai_disponible: isAiConfigured() });
}

export async function POST(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const rate = await checkRateLimit({
    key: rateLimitKey("analisis/create", request, user.id),
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rate.ok) {
    return rateLimitResponse(rate.retryAfterSeconds ?? 3600);
  }

  if (!isAiConfigured()) {
    return json(
      { error: aiConfigErrorMessage(), code: "AI_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  let body: CreateAnalisisBody;
  try {
    body = (await request.json()) as CreateAnalisisBody;
  } catch {
    return json({ error: "JSON inválido" }, { status: 400 });
  }

  const nombre = body.nombre?.trim();
  const expedienteId = body.expedienteId?.trim();
  const adjuntoIds = body.adjuntoIds ?? [];
  const plantillaKey = body.plantillaKey?.trim() || "general";

  if (!nombre) {
    return json({ error: "Nombre del análisis obligatorio" }, { status: 400 });
  }

  if (adjuntoIds.length === 0) {
    return json({ error: "Seleccioná al menos un documento" }, { status: 400 });
  }

  const campos = camposDesdePlantilla({
    plantillaKey,
    plantillaCampos: null,
  });

  const { data: created, error: insertError } = await supabase
    .from("documento_analisis")
    .insert({
      user_id: user.id,
      nombre,
      expediente_id: expedienteId || null,
      plantilla_id: null,
      plantilla_key: plantillaKey,
      campos: campos as never,
      adjunto_ids: adjuntoIds,
      estado: "borrador",
    } as never)
    .select("*")
    .single();

  if (insertError || !created) {
    return json({ error: insertError?.message ?? "Error al crear" }, { status: 500 });
  }

  for (const adjuntoId of adjuntoIds) {
    await supabase
      .from("expediente_adjuntos")
      .update({ expediente_id: expedienteId } as never)
      .eq("id", adjuntoId)
      .eq("user_id", user.id);
  }

  try {
    const analisis = await ejecutarAnalisisDocumentos(created.id, user.id);
    return json({ analisis }, { status: 201 });
  } catch (err) {
    return json(
      {
        analisis: created,
        error: err instanceof Error ? err.message : "Error al analizar",
        code: "ANALYSIS_FAILED",
      },
      { status: 500 }
    );
  }
}
