import { createServiceClient } from "@/lib/supabase/admin";
import { generarPaqueteJudicial } from "@/lib/actuaciones/generator";
import type { MembreteAbogado } from "@/lib/actuaciones/generator";
import type {
  ExpedienteActuaciones,
  ParteExpediente,
  Resolucion,
  RolParte,
} from "@/lib/actuaciones/types";
import { generateDocumentoDocxBuffer } from "@/lib/documents/generate-docx";
import { mapTipoActuacion } from "./interpret-notificacion-ai";
import type { InterpretacionNotificacion } from "./types";
import type { MembreteProfile } from "@/types";

const STORAGE_BUCKET = "actuaciones";

function textoToHtml(texto: string): string {
  return texto
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function buildCartaHtml(
  interp: InterpretacionNotificacion,
  profile: MembreteProfile | null
): string {
  const v = interp.variables_carta ?? {};
  const destinatario = v.destinatario ?? "Destinatario";
  const ciudad = profile?.ciudad ?? "Santa Fe";
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (interp.texto_respuesta.length > 80) {
    return `<p><strong>CARTA DOCUMENTO</strong></p>
<p><strong>${ciudad}</strong>, ${fecha}</p>
<p>Señor/a: <strong>${destinatario}</strong><br/>Domicilio: ${v.domicilio_destinatario ?? "[Domicilio]"}</p>
${textoToHtml(interp.texto_respuesta)}
<p>${profile?.full_name ?? ""}<br/>Tº ${profile?.matricula ?? ""} CPASF<br/>${profile?.estudio_nombre ?? profile?.full_name ?? ""}<br/>${profile?.domicilio_profesional ?? ""}<br/>${profile?.telefono ?? ""}</p>`;
  }

  return `<p><strong>CARTA DOCUMENTO</strong></p>
<p><strong>${ciudad}</strong>, ${fecha}</p>
<p>Señor/a: <strong>${destinatario}</strong><br/>Domicilio: ${v.domicilio_destinatario ?? "[Domicilio]"}</p>
<p>Por la presente intimo a Ud. ${v.concepto ? `en concepto de ${v.concepto}` : "a cumplir lo solicitado"}, ${v.monto ? `por la suma de <strong>${v.monto}</strong>` : ""} ${v.plazo ? `dentro del plazo de ${v.plazo}` : ""}.</p>
${textoToHtml(interp.texto_respuesta)}
<p>Queda Ud. debidamente notificado/a.</p>
<p>${profile?.full_name ?? ""}<br/>Tº ${profile?.matricula ?? ""} CPASF<br/>${profile?.estudio_nombre ?? profile?.full_name ?? ""}<br/>${profile?.domicilio_profesional ?? ""}<br/>${profile?.telefono ?? ""}</p>`;
}

export async function generarDocumentoDesdeInterpretacion(input: {
  userId: string;
  expediente: ExpedienteActuaciones;
  resolucion: Resolucion;
  partes: ParteExpediente[];
  interpretacion: InterpretacionNotificacion;
  profile: MembreteProfile | null;
}): Promise<{
  actuacion_id: string;
  download_url: string;
  download_filename: string;
  documentos_count: number;
}> {
  const abogado: MembreteAbogado = {
    full_name: input.profile?.full_name ?? null,
    matricula: input.profile?.matricula ?? null,
    ciudad: input.profile?.ciudad ?? null,
  };

  if (input.interpretacion.tipo_documento === "carta_documento") {
    const titulo = `Carta documento — ${input.interpretacion.tipo_tramite}`;
    const contenidoHtml = buildCartaHtml(input.interpretacion, input.profile);
    const docx = await generateDocumentoDocxBuffer({
      titulo,
      contenidoHtml,
      membrete: {
        estudio:
          input.profile?.estudio_nombre ??
          input.profile?.full_name ??
          "Estudio Jurídico",
        abogado: input.profile?.full_name ?? "",
        matricula: input.profile?.matricula ?? "",
        domicilio: input.profile?.domicilio_profesional ?? "",
        telefono: input.profile?.telefono ?? "",
        ciudad: input.profile?.ciudad ?? "Santa Fe",
      },
    });

    const admin = createServiceClient();
    const actuacionId = crypto.randomUUID();
    const safeNum = input.expediente.numero.replace(/[^\w-]/g, "_").slice(0, 40);
    const filename = `carta_documento_exp_${safeNum}.docx`;
    const storagePath = `${input.userId}/${input.expediente.id}/${actuacionId}_${filename}`;

    const { error: uploadError } = await admin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, docx, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`No se pudo guardar el documento: ${uploadError.message}`);
    }

    await admin.from("actuaciones_generadas").insert({
      id: actuacionId,
      expediente_id: input.expediente.id,
      user_id: input.userId,
      tipo_actuacion: "cedula",
      resolucion_id: input.resolucion.id,
      jurisdiccion: input.expediente.jurisdiccion,
      plantilla_key: "carta_documento_ia",
      zip_path: storagePath,
      documentos_count: 1,
      manifest: {
        version: "1.0",
        tipo: "carta_documento",
        resumen: input.interpretacion.resumen,
      },
    } as never);

    return {
      actuacion_id: actuacionId,
      download_url: `/api/actuaciones/${actuacionId}/descargar`,
      download_filename: filename,
      documentos_count: 1,
    };
  }

  const destinatarioIds = input.partes
    .filter((p) => {
      const interp = input.interpretacion.partes.find(
        (ip) =>
          ip.apellido.toLowerCase() === p.apellido.toLowerCase() &&
          ip.nombre.toLowerCase() === p.nombre.toLowerCase()
      );
      return interp?.notificar !== false;
    })
    .map((p) => p.id);

  const ids =
    destinatarioIds.length > 0
      ? destinatarioIds
      : input.partes.map((p) => p.id);

  if (ids.length === 0) {
    throw new Error(
      "La IA no identificó destinatarios. Revisá el documento o completá los datos en Configuración."
    );
  }

  const paquete = await generarPaqueteJudicial({
    request: {
      expediente_id: input.expediente.id,
      resolucion_id: input.resolucion.id,
      destinatario_ids: ids,
      tipo_actuacion: mapTipoActuacion(input.interpretacion.tipo_documento),
    },
    expediente: input.expediente,
    resolucion: {
      ...input.resolucion,
      texto:
        input.interpretacion.texto_respuesta.trim() ||
        input.resolucion.texto,
    },
    partes: input.partes,
    abogado,
    userId: input.userId,
  });

  return {
    actuacion_id: paquete.actuacion_id,
    download_url: `/api/actuaciones/${paquete.actuacion_id}/descargar`,
    download_filename: paquete.zip_filename,
    documentos_count: paquete.cantidad_documentos,
  };
}

export async function persistirInterpretacion(input: {
  supabase: Awaited<
    ReturnType<(typeof import("@/lib/supabase/server"))["createClient"]>
  >;
  expedienteId: string;
  interpretacion: InterpretacionNotificacion;
}): Promise<{ resolucion: Resolucion; partes: ParteExpediente[] }> {
  const fecha =
    input.interpretacion.fecha_resolucion ??
    new Date().toISOString().slice(0, 10);

  const { data: resolucion, error: resError } = await input.supabase
    .from("resoluciones")
    .insert({
      expediente_id: input.expedienteId,
      fecha,
      tipo: input.interpretacion.tipo_tramite,
      texto: input.interpretacion.texto_proveido,
    } as never)
    .select()
    .single();

  if (resError || !resolucion) {
    throw new Error(resError?.message ?? "Error al guardar resolución");
  }

  const partesInsertadas: ParteExpediente[] = [];

  const partesFuente =
    input.interpretacion.partes.length > 0
      ? input.interpretacion.partes
      : [
          {
            nombre: "A",
            apellido: "Notificar",
            rol: "demandado" as RolParte,
            domicilio: input.interpretacion.variables_carta?.domicilio_destinatario ?? null,
            notificar: true,
          },
        ];

  for (const parte of partesFuente) {
    const { data: inserted } = await input.supabase
      .from("partes_expediente")
      .insert({
        expediente_id: input.expedienteId,
        nombre: parte.nombre,
        apellido: parte.apellido,
        rol: parte.rol as RolParte,
        domicilio: parte.domicilio,
      } as never)
      .select()
      .single();

    if (inserted) partesInsertadas.push(inserted as ParteExpediente);
  }

  return {
    resolucion: resolucion as Resolucion,
    partes: partesInsertadas,
  };
}
