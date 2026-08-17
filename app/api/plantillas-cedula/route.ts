import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import { listPlantillasCedulaUsuario } from "@/lib/plantillas-cedula/repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const plantillas = await listPlantillasCedulaUsuario(supabase, user.id);
    return json({ plantillas });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Error al listar plantillas" },
      { status: 500 }
    );
  }
}
