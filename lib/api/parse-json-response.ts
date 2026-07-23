/** Parsea respuestas de API aunque el servidor devuelva HTML (p. ej. timeout 504 en Vercel). */
export async function parseJsonResponse<T>(
  res: Response
): Promise<T> {
  const text = await res.text();

  if (!text.trim()) {
    if (res.status === 504 || res.status === 502) {
      throw new Error(
        "La generación tardó demasiado. Probá con un PDF más chico o reintentá en unos segundos."
      );
    }
    if (res.status === 413) {
      throw new Error("El archivo es demasiado grande (máx. 4 MB).");
    }
    throw new Error(`Error del servidor (${res.status}). Reintentá.`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 504 || res.status === 502) {
      throw new Error(
        "La generación tardó demasiado. En Vercel Hobby el límite es ~10 s; probá de nuevo o usá un archivo más liviano."
      );
    }
    throw new Error(
      "Respuesta inválida del servidor. Verificá OPENROUTER_API_KEY y SUPABASE_SERVICE_ROLE_KEY en Vercel."
    );
  }
}
