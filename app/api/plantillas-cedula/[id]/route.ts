import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route-handler";
import {
  deletePlantillaFromStorage,
  PlantillaCedulaError,
} from "@/lib/plantillas-cedula/storage";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, withSessionCookies, getUser } =
    createSupabaseRouteClient(request);
  const json = (body: unknown, init?: ResponseInit) =>
    withSessionCookies(NextResponse.json(body, init));

  const user = await getUser();
  if (!user) {
    return json({ error: "No autorizado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: plantilla } = await supabase
    .from("plantillas_cedula_usuario")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!plantilla) {
    return json({ error: "Plantilla no encontrada" }, { status: 404 });
  }

  try {
    await deletePlantillaFromStorage(plantilla.storage_path);
  } catch (err) {
    if (
      !(err instanceof PlantillaCedulaError && err.code === "NOT_FOUND")
    ) {
      return json(
        { error: err instanceof Error ? err.message : "Error al eliminar archivo" },
        { status: 500 }
      );
    }
  }

  const { error } = await supabase
    .from("plantillas_cedula_usuario")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ ok: true });
}
