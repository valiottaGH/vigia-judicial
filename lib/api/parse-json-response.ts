/** Parsea respuestas de API aunque el servidor devuelva HTML (p. ej. timeout 504 en Vercel). */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
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
    if (res.status === 401) {
      throw new Error("Sesión expirada. Volvé a iniciar sesión.");
    }
    throw new Error(`Error del servidor (${res.status}). Reintentá.`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 504 || res.status === 502) {
      throw new Error(
        "La generación tardó demasiado. Probá con un PDF más liviano o reintentá."
      );
    }
    if (res.status === 401) {
      throw new Error("Sesión expirada. Volvé a iniciar sesión.");
    }
    if (text.trimStart().startsWith("<!") || text.includes("<html")) {
      if (res.status === 500 || res.status === 503) {
        throw new Error(
          "El servidor tardó demasiado o falló al procesar el PDF (error 500). Probá con un archivo más liviano o reintentá en unos segundos. Si persiste, revisá Vercel → Logs."
        );
      }
      throw new Error(
        `Error del servidor (${res.status}). Reintentá en unos segundos.`
      );
    }
    if (text.startsWith("/login")) {
      throw new Error("Sesión expirada. Volvé a iniciar sesión.");
    }
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(
      preview
        ? `Error del servidor (${res.status}): ${preview}`
        : `Error del servidor (${res.status}). Reintentá.`
    );
  }
}
