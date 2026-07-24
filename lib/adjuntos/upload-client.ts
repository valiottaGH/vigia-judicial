"use client";

import { createClient } from "@/lib/supabase/client";
import {
  ADJUNTOS_BUCKET,
  INVALID_ADJUNTO_MESSAGE,
  resolveAdjuntoMime,
} from "./constants";

/** Sube el archivo directo a Supabase Storage (evita límite de body en Vercel). */
export async function uploadAdjuntoFromBrowser(input: {
  storagePath: string;
  file: File;
}): Promise<void> {
  const mime = resolveAdjuntoMime(input.file);
  if (!mime) {
    throw new Error(INVALID_ADJUNTO_MESSAGE);
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(ADJUNTOS_BUCKET)
    .upload(input.storagePath, input.file, {
      contentType: mime,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message === "The resource already exists"
        ? "Ese archivo ya fue subido. Volvé a intentar."
        : error.message || "No se pudo subir el archivo"
    );
  }
}
