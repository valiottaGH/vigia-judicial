import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { DocumentoPlantilla } from "@/lib/jurisdicciones/types";
import { ActuacionError } from "./types";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    fontFamily: "Times-Roman",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    marginBottom: 12,
  },
  text: {
    marginBottom: 6,
    textAlign: "justify",
  },
  pie: {
    marginTop: 24,
  },
});

function ActuacionPdfDoc({ doc }: { doc: DocumentoPlantilla }) {
  const encLines = doc.encabezado?.split("\n") ?? [];
  const cuerpoLines = doc.cuerpo.split("\n");
  const pieLines = doc.pie?.split("\n") ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{doc.titulo}</Text>
        <View style={styles.section}>
          {encLines.map((line, i) => (
            <Text key={`e-${i}`} style={styles.text}>
              {line}
            </Text>
          ))}
        </View>
        <View style={styles.section}>
          {cuerpoLines.map((line, i) => (
            <Text key={`c-${i}`} style={styles.text}>
              {line || " "}
            </Text>
          ))}
        </View>
        {pieLines.length > 0 && (
          <View style={styles.pie}>
            {pieLines.map((line, i) => (
              <Text key={`p-${i}`} style={styles.text}>
                {line}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

/** Genera PDF desde plantilla; retorna null si falla (usa HTML fallback). */
export async function documentoToPdf(
  doc: DocumentoPlantilla
): Promise<Uint8Array | null> {
  try {
    const buffer = await pdf(<ActuacionPdfDoc doc={doc} />).toBuffer();

    if (buffer instanceof Uint8Array) {
      return buffer;
    }

    const arrayBuffer = await new Response(buffer as unknown as BodyInit).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch {
    return null;
  }
}

/** HTML imprimible como fallback estable cuando PDF falla. */
export function documentoToHtml(doc: DocumentoPlantilla): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const lines = (text: string) =>
    text
      .split("\n")
      .map((l) => `<p>${esc(l) || "&nbsp;"}</p>`)
      .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${esc(doc.titulo)}</title>
  <style>
    body { font-family: "Times New Roman", serif; max-width: 700px; margin: 2cm auto; line-height: 1.5; font-size: 12pt; }
    h1 { text-align: center; font-size: 14pt; }
    p { text-align: justify; margin: 0.4em 0; }
    .pie { margin-top: 2em; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${esc(doc.titulo)}</h1>
  ${doc.encabezado ? `<div class="encabezado">${lines(doc.encabezado)}</div>` : ""}
  <div class="cuerpo">${lines(doc.cuerpo)}</div>
  ${doc.pie ? `<div class="pie">${lines(doc.pie)}</div>` : ""}
</body>
</html>`;
}

export async function documentoToPdfOrThrow(
  doc: DocumentoPlantilla
): Promise<{ pdf: Uint8Array | null; html: string }> {
  const pdfBuffer = await documentoToPdf(doc);
  const html = documentoToHtml(doc);

  if (!pdfBuffer) {
    return { pdf: null, html };
  }

  return { pdf: pdfBuffer, html };
}

/** Wrapper que lanza ActuacionError solo si ambos formatos fallan. */
export async function documentoToPdfSafe(
  doc: DocumentoPlantilla
): Promise<{ pdf: Uint8Array | null; html: string }> {
  try {
    return await documentoToPdfOrThrow(doc);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    throw new ActuacionError("PDF_ERROR", `No se pudo generar PDF: ${msg}`);
  }
}
