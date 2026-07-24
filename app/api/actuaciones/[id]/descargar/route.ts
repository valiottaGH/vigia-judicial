import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { buildPaqueteZipFilename } from "@/lib/actuaciones/zip";
import type { TipoActuacion } from "@/lib/actuaciones/types";
import { logSecurityEvent } from "@/lib/security/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

const STORAGE_BUCKET = "actuaciones";

/** Descarga el ZIP con nombre legible (no UUID de Storage). */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: actuacion, error } = await supabase
    .from("actuaciones_generadas")
    .select("zip_path, tipo_actuacion, expediente_id, manifest")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !actuacion) {
    return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
  }

  const { data: expediente } = await supabase
    .from("expedientes")
    .select("numero")
    .eq("id", actuacion.expediente_id)
    .maybeSingle();

  const admin = createServiceClient();
  const { data: file, error: dlError } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(actuacion.zip_path);

  if (dlError || !file) {
    return NextResponse.json(
      { error: "No se pudo descargar el archivo" },
      { status: 500 }
    );
  }

  const numero = expediente?.numero ?? "expediente";
  const isDocx = actuacion.zip_path.endsWith(".docx");
  const manifest = actuacion.manifest as { tipo?: string } | null;
  const isCarta =
    isDocx || manifest?.tipo === "carta_documento";

  const filename = isCarta
    ? `carta_documento_exp_${numero.replace(/[^\w-]/g, "_")}.docx`
    : buildPaqueteZipFilename(
        numero,
        actuacion.tipo_actuacion as TipoActuacion
      );

  const buffer = await file.arrayBuffer();

  void logSecurityEvent({
    userId: user.id,
    action: "document.download",
    resourceType: "actuacion",
    resourceId: id,
    metadata: { expediente_id: actuacion.expediente_id },
    request,
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": isCarta
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
