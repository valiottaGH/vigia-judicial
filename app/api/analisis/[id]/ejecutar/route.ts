import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { ejecutarAnalisisDocumentos } from "@/lib/analisis/run-analysis";
import { isAiConfigured, aiConfigErrorMessage } from "@/lib/ai/config";

export const maxDuration = 300;
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return json(
      { error: aiConfigErrorMessage(), code: "AI_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const { data: exists } = await supabase
    .from("documento_analisis")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!exists) {
    return json({ error: "Análisis no encontrado" }, { status: 404 });
  }

  try {
    const analisis = await ejecutarAnalisisDocumentos(id, user.id);
    return json({ analisis });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al reanalizar" },
      { status: 500 }
    );
  }
}
