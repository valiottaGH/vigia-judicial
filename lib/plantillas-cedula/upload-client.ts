"use client";

import { createClient } from "@/lib/supabase/client";
import { PLANTILLAS_BUCKET, PLANTILLA_DOCX_MIME } from "./constants";

export async function uploadPlantillaFromBrowser(input: {
  storagePath: string;
  file: File;
}): Promise<void> {
  const lower = input.file.name.toLowerCase();
  if (!lower.endsWith(".docx")) {
    throw new Error("Solo se aceptan archivos DOCX (.docx)");
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PLANTILLAS_BUCKET)
    .upload(input.storagePath, input.file, {
      contentType: PLANTILLA_DOCX_MIME,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message === "The resource already exists"
        ? "Esa plantilla ya fue subida. Volvé a intentar."
        : error.message || "No se pudo subir la plantilla"
    );
  }
}
