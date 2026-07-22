import type { Json } from "@/types/database";
import { createServiceClient } from "@/lib/supabase/admin";
import { downloadAdjuntoFromStorage } from "@/lib/adjuntos/storage";
import type { ExpedienteAdjunto } from "@/lib/adjuntos/types";
import { getJurisdictionTemplate, normalizeJurisdiccionKey } from "@/lib/jurisdicciones";
import type { PlantillaVariables } from "@/lib/jurisdicciones/types";
import { documentoToDocx } from "./docx";
import { documentoToPdfSafe } from "./pdf";
import { renderDocumento, renderEscritoAcompanamiento } from "./templates";
import {
  buildDocumentFilename,
  createZipBuffer,
  type ZipEntry,
} from "./zip";
import { mergeInstructionWithRequest, parseInstruction } from "./instruction-parser";
import type {
  ActuacionRequest,
  DocumentoGenerado,
  GeneracionContext,
  ManifestDocumento,
  ManifestPaquete,
  PaqueteJudicial,
  ParteExpediente,
  Resolucion,
} from "./types";
import {
  ActuacionError,
  TIPOS_ACTUACION_LABELS,
  type ExpedienteActuaciones,
  type TipoActuacion,
} from "./types";

export interface GeneradorInput {
  request: ActuacionRequest;
  expediente: ExpedienteActuaciones;
  resolucion: Resolucion;
  partes: ParteExpediente[];
  abogado: MembreteAbogado;
  userId: string;
}

export interface MembreteAbogado {
  full_name: string | null;
  matricula: string | null;
  ciudad: string | null;
}

const STORAGE_BUCKET = "actuaciones";

function resolveDestinatarios(
  partes: ParteExpediente[],
  ids: string[],
  parsed: ReturnType<typeof mergeInstructionWithRequest>
): ParteExpediente[] {
  if (parsed.useAllDemandados) {
    return partes.filter((p) => p.rol === "demandado");
  }
  if (parsed.useAllActores) {
    return partes.filter((p) => p.rol === "actor");
  }
  if (parsed.useAll) {
    return partes;
  }

  const selected = partes.filter((p) => ids.includes(p.id));
  return selected;
}

function buildVariablesBase(
  ctx: GeneracionContext,
  abogado: MembreteAbogado
): Omit<PlantillaVariables, "destinatario" | "domicilio"> {
  const tribunal =
    ctx.expediente.juzgado ??
    ctx.expediente.fuero ??
    `Juzgado competente — ${ctx.expediente.jurisdiccion}`;

  return {
    tribunal,
    caratula: ctx.expediente.caratula ?? "Sin carátula",
    numero_expediente: ctx.expediente.numero,
    jurisdiccion: ctx.expediente.jurisdiccion,
    texto_resolucion: ctx.resolucion.texto,
    fecha: new Date(ctx.resolucion.fecha).toLocaleDateString("es-AR"),
    abogado: abogado.full_name ?? "Abogado/a",
    matricula: abogado.matricula ?? "S/N",
    ciudad: abogado.ciudad ?? ctx.expediente.jurisdiccion,
    provincia: ctx.expediente.jurisdiccion,
  };
}

function parteNombre(p: ParteExpediente): string {
  return `${p.apellido} ${p.nombre}`.trim();
}

async function generarDocumentoIndividual(
  tipo: TipoActuacion,
  template: ReturnType<typeof getJurisdictionTemplate>,
  variables: PlantillaVariables,
  index: number,
  parte: ParteExpediente
): Promise<DocumentoGenerado> {
  const doc = renderDocumento(tipo, template, variables);
  const docx = await documentoToDocx(doc);
  const { pdf, html } = await documentoToPdfSafe(doc);

  const prefix =
    tipo === "cedula"
      ? "cedula"
      : tipo === "oficio"
        ? "oficio"
        : tipo === "mandamiento"
          ? "mandamiento"
          : "notificacion";

  const nombre_base = buildDocumentFilename(
    prefix,
    index,
    parte.apellido,
    parte.nombre,
    "docx"
  ).replace(/\.docx$/, "");

  return {
    nombre_base,
    destinatario_id: parte.id,
    destinatario_nombre: parteNombre(parte),
    tipo,
    docx,
    pdf,
    html_fallback: pdf ? null : html,
  };
}

/** Motor principal: genera paquete completo, ZIP y sube a Storage. */
export async function generarPaqueteJudicial(
  input: GeneradorInput
): Promise<PaqueteJudicial> {
  const { request, expediente, resolucion, partes, abogado, userId } = input;

  const parsed = parseInstruction(request.instruccion ?? "");
  const merged = mergeInstructionWithRequest(parsed, {
    tipo_actuacion: request.tipo_actuacion,
    destinatario_ids: request.destinatario_ids,
  });

  const tipo = merged.tipo;

  if (tipo === "escrito_acompanamiento") {
    throw new ActuacionError(
      "PLANTILLA_INVALIDA",
      "El escrito de acompañamiento se genera automáticamente con el paquete"
    );
  }

  const destinatarios = resolveDestinatarios(
    partes,
    request.destinatario_ids,
    merged
  );

  if (destinatarios.length === 0) {
    throw new ActuacionError(
      "DESTINATARIOS_VACIOS",
      "No hay destinatarios seleccionados. Agregá partes al expediente o seleccioná al menos uno."
    );
  }

  const plantillaKey = normalizeJurisdiccionKey(expediente.jurisdiccion);
  const template = getJurisdictionTemplate(expediente.jurisdiccion);

  if (!template) {
    throw new ActuacionError(
      "JURISDICCION_SIN_PLANTILLA",
      `No hay plantilla para la jurisdicción "${expediente.jurisdiccion}"`
    );
  }

  const ctx: GeneracionContext = {
    expediente,
    resolucion,
    destinatarios,
    tipo,
    variables_base: buildVariablesBase(
      {
        expediente,
        resolucion,
        destinatarios,
        tipo,
        variables_base: {} as GeneracionContext["variables_base"],
        instruccion: request.instruccion ?? null,
      },
      abogado
    ),
    instruccion: request.instruccion ?? null,
  };

  const variablesBase = buildVariablesBase(ctx, abogado);
  const documentos: DocumentoGenerado[] = [];

  for (let i = 0; i < destinatarios.length; i++) {
    const parte = destinatarios[i];
    const variables: PlantillaVariables = {
      ...variablesBase,
      destinatario: parteNombre(parte),
      domicilio: parte.domicilio ?? "Domicilio denunciado en autos",
    };

    const doc = await generarDocumentoIndividual(
      tipo,
      template,
      variables,
      i + 1,
      parte
    );
    documentos.push(doc);
  }

  const escritoDoc = renderEscritoAcompanamiento(template, {
    ...variablesBase,
    destinatario: "",
    domicilio: "",
    tipo_actuacion: TIPOS_ACTUACION_LABELS[tipo],
    cantidad_documentos: documentos.length,
  });

  const escritoDocx = await documentoToDocx(escritoDoc);
  const escritoPdfResult = await documentoToPdfSafe(escritoDoc);

  const manifestDocs: ManifestDocumento[] = [];
  const zipEntries: ZipEntry[] = [];

  for (const doc of documentos) {
    const docxName = `${doc.nombre_base}.docx`;
    zipEntries.push({ path: docxName, data: doc.docx });
    manifestDocs.push({
      nombre: docxName,
      tipo: doc.tipo,
      destinatario: doc.destinatario_nombre,
      formato: "docx",
    });

    if (doc.pdf) {
      const pdfName = `${doc.nombre_base}.pdf`;
      zipEntries.push({ path: pdfName, data: doc.pdf });
      manifestDocs.push({
        nombre: pdfName,
        tipo: doc.tipo,
        destinatario: doc.destinatario_nombre,
        formato: "pdf",
      });
    } else if (doc.html_fallback) {
      const htmlName = `${doc.nombre_base}.html`;
      zipEntries.push({ path: htmlName, data: doc.html_fallback });
      manifestDocs.push({
        nombre: htmlName,
        tipo: doc.tipo,
        destinatario: doc.destinatario_nombre,
        formato: "html",
      });
    }
  }

  zipEntries.push({ path: "escrito_acompanamiento.docx", data: escritoDocx });
  manifestDocs.push({
    nombre: "escrito_acompanamiento.docx",
    tipo: "escrito_acompanamiento",
    destinatario: "Tribunal",
    formato: "docx",
  });

  if (escritoPdfResult.pdf) {
    zipEntries.push({
      path: "escrito_acompanamiento.pdf",
      data: escritoPdfResult.pdf,
    });
    manifestDocs.push({
      nombre: "escrito_acompanamiento.pdf",
      tipo: "escrito_acompanamiento",
      destinatario: "Tribunal",
      formato: "pdf",
    });
  } else {
    zipEntries.push({
      path: "escrito_acompanamiento.html",
      data: escritoPdfResult.html,
    });
    manifestDocs.push({
      nombre: "escrito_acompanamiento.html",
      tipo: "escrito_acompanamiento",
      destinatario: "Tribunal",
      formato: "html",
    });
  }

  let adjuntosCount = 0;
  if (request.adjunto_ids && request.adjunto_ids.length > 0) {
    const admin = createServiceClient();
    const { data: adjuntosRows } = await admin
      .from("expediente_adjuntos")
      .select("*")
      .eq("expediente_id", expediente.id)
      .eq("user_id", userId)
      .in("id", request.adjunto_ids);

    const adjuntos = (adjuntosRows ?? []) as ExpedienteAdjunto[];

    for (const adj of adjuntos) {
      const bytes = await downloadAdjuntoFromStorage(adj.storage_path);
      const zipName = `adjuntos/${adj.nombre_original}`;
      zipEntries.push({ path: zipName, data: bytes });
      manifestDocs.push({
        nombre: zipName,
        tipo: "adjunto",
        destinatario: adj.nombre_original,
        formato: adj.mime_type.includes("pdf") ? "pdf" : "doc",
      });
      adjuntosCount += 1;
    }
  }

  const generadoEn = new Date().toISOString();
  const manifest: ManifestPaquete = {
    version: "1.0",
    generado_en: generadoEn,
    jurisdiccion: expediente.jurisdiccion,
    plantilla_key: plantillaKey,
    expediente_numero: expediente.numero,
    caratula: expediente.caratula ?? "",
    resolucion_id: resolucion.id,
    tipo_actuacion: tipo,
    instruccion: request.instruccion ?? null,
    documentos: manifestDocs,
  };

  const zipBuffer = await createZipBuffer(zipEntries, manifest);

  const actuacionId = crypto.randomUUID();
  const zipPath = `${userId}/${expediente.id}/${actuacionId}.zip`;

  const admin = createServiceClient();
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(zipPath, zipBuffer, {
      contentType: "application/zip",
      upsert: false,
    });

  if (uploadError) {
    throw new ActuacionError(
      "STORAGE_ERROR",
      `No se pudo subir el ZIP: ${uploadError.message}. Verificá que el bucket "actuaciones" exista en Supabase Storage.`
    );
  }

  const { data: urlData } = admin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(zipPath);

  let signedUrl = urlData.publicUrl;

  const { data: signedData, error: signError } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(zipPath, 60 * 60 * 24 * 7);

  if (!signError && signedData?.signedUrl) {
    signedUrl = signedData.signedUrl;
  }

  const { error: insertError } = await admin
    .from("actuaciones_generadas")
    .insert({
      id: actuacionId,
      expediente_id: expediente.id,
      user_id: userId,
      tipo_actuacion: tipo,
      resolucion_id: resolucion.id,
      instruccion: request.instruccion ?? null,
      jurisdiccion: expediente.jurisdiccion,
      plantilla_key: plantillaKey,
      zip_path: zipPath,
      zip_url: signedUrl,
      manifest: manifest as unknown as Json,
      documentos_count: documentos.length + 1 + adjuntosCount,
    } as never);

  if (insertError) {
    throw new ActuacionError(
      "STORAGE_ERROR",
      `Paquete generado pero no se pudo registrar: ${insertError.message}`
    );
  }

  return {
    actuacion_id: actuacionId,
    zip_url: signedUrl,
    manifest,
    documentos,
    jurisdiccion: expediente.jurisdiccion,
    plantilla_key: plantillaKey,
    plantilla_nombre: template.nombre,
    cantidad_documentos: documentos.length + 1 + adjuntosCount,
    generado_en: generadoEn,
  };
}
