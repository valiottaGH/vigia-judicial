import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generarPaqueteJudicial,
  type MembreteAbogado,
} from "@/lib/actuaciones/generator";
import { parseInstruction } from "@/lib/actuaciones/instruction-parser";
import {
  ActuacionError,
  TIPOS_ACTUACION,
  type ActuacionGeneradaResponse,
  type ActuacionRequest,
  type ExpedienteActuaciones,
  type RolParte,
  type TipoActuacion,
} from "@/lib/actuaciones/types";
import { getJurisdictionTemplate } from "@/lib/jurisdicciones";

function errorResponse(err: ActuacionError): NextResponse {
  const statusMap: Record<string, number> = {
    UNAUTHORIZED: 401,
    EXPEDIENTE_NOT_FOUND: 404,
    RESOLUCION_NOT_FOUND: 404,
    DESTINATARIOS_VACIOS: 400,
    JURISDICCION_SIN_PLANTILLA: 400,
    PLANTILLA_INVALIDA: 400,
    DOCX_ERROR: 500,
    PDF_ERROR: 500,
    ZIP_ERROR: 500,
    STORAGE_ERROR: 500,
  };

  return NextResponse.json(
    { error: err.message, code: err.code },
    { status: statusMap[err.code] ?? 500 }
  );
}

function isValidTipo(value: string): value is TipoActuacion {
  return (TIPOS_ACTUACION as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as ActuacionRequest;

    if (!body.expediente_id || !body.resolucion_id) {
      return NextResponse.json(
        { error: "Faltan expediente_id o resolucion_id" },
        { status: 400 }
      );
    }

    if (!body.tipo_actuacion || !isValidTipo(body.tipo_actuacion)) {
      return NextResponse.json(
        { error: "Tipo de actuación inválido" },
        { status: 400 }
      );
    }

    const { data: expediente, error: expError } = await supabase
      .from("expedientes")
      .select("id, numero, caratula, jurisdiccion, juzgado, fuero, user_id")
      .eq("id", body.expediente_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (expError || !expediente) {
      return NextResponse.json(
        { error: "Expediente no encontrado o sin permisos" },
        { status: 404 }
      );
    }

    const { data: resolucion, error: resError } = await supabase
      .from("resoluciones")
      .select("*")
      .eq("id", body.resolucion_id)
      .eq("expediente_id", body.expediente_id)
      .maybeSingle();

    if (resError || !resolucion) {
      return NextResponse.json(
        { error: "Resolución no encontrada para este expediente" },
        { status: 404 }
      );
    }

    const { data: partes } = await supabase
      .from("partes_expediente")
      .select("*")
      .eq("expediente_id", body.expediente_id)
      .order("created_at", { ascending: true });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, matricula, ciudad")
      .eq("id", user.id)
      .single();

    const abogado: MembreteAbogado = {
      full_name: profile?.full_name ?? null,
      matricula: profile?.matricula ?? null,
      ciudad: profile?.ciudad ?? null,
    };

    const paquete = await generarPaqueteJudicial({
      request: body,
      expediente: expediente as ExpedienteActuaciones,
      resolucion,
      partes: partes ?? [],
      abogado,
      userId: user.id,
    });

    const template = getJurisdictionTemplate(expediente.jurisdiccion);

    const destMap = new Map<
      string,
      { id: string; nombre: string; apellido: string; rol: RolParte; archivos: string[] }
    >();

    for (const doc of paquete.manifest.documentos) {
      if (doc.tipo === "escrito_acompanamiento") continue;
      const match = paquete.documentos.find(
        (d) =>
          doc.nombre.startsWith(d.nombre_base) ||
          doc.destinatario === d.destinatario_nombre
      );
      const key = match?.destinatario_id ?? doc.destinatario;
      const existing = destMap.get(key);
      if (existing) {
        existing.archivos.push(doc.nombre);
      } else {
        const parte = (partes ?? []).find((p) => p.id === match?.destinatario_id);
        destMap.set(key, {
          id: match?.destinatario_id ?? key,
          nombre: parte?.nombre ?? doc.destinatario.split(" ")[1] ?? "",
          apellido: parte?.apellido ?? doc.destinatario.split(" ")[0] ?? "",
          rol: (parte?.rol ?? "tercero") as RolParte,
          archivos: [doc.nombre],
        });
      }
    }

    const response: ActuacionGeneradaResponse = {
      id: paquete.actuacion_id,
      expediente_id: body.expediente_id,
      tipo_actuacion: paquete.manifest.tipo_actuacion,
      jurisdiccion: paquete.jurisdiccion,
      plantilla_key: paquete.plantilla_key,
      plantilla_nombre: template.nombre,
      documentos_count: paquete.cantidad_documentos,
      resolucion,
      zip_url: paquete.zip_url,
      manifest: paquete.manifest,
      created_at: paquete.generado_en,
      destinatarios: Array.from(destMap.values()),
    };

    if (body.instruccion) {
      response.manifest.instruccion = body.instruccion;
      parseInstruction(body.instruccion);
    }

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof ActuacionError) {
      return errorResponse(err);
    }

    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg, code: "INTERNAL" }, { status: 500 });
  }
}
