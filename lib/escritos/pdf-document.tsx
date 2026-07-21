import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { htmlToPlainParagraphs } from "./html";

export interface MembretePdf {
  estudio: string;
  abogado: string;
  matricula: string;
  domicilio: string;
  telefono: string;
  ciudad: string;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 55,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  membrete: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 12,
    marginBottom: 24,
  },
  estudio: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  sub: {
    fontSize: 9,
    color: "#555",
    marginTop: 2,
  },
  titulo: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  parrafo: {
    marginBottom: 8,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 55,
    right: 55,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
});

export function EscritoPdfDocument({
  titulo,
  contenidoHtml,
  membrete,
}: {
  titulo: string;
  contenidoHtml: string;
  membrete: MembretePdf;
}) {
  const parrafos = htmlToPlainParagraphs(contenidoHtml);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.membrete}>
          <Text style={styles.estudio}>{membrete.estudio || "Estudio Juridico"}</Text>
          {membrete.abogado ? (
            <Text style={styles.sub}>
              {membrete.abogado}
              {membrete.matricula ? ` — Mat. ${membrete.matricula} CPASF` : ""}
            </Text>
          ) : null}
          {membrete.domicilio ? (
            <Text style={styles.sub}>{membrete.domicilio}</Text>
          ) : null}
          {membrete.telefono ? (
            <Text style={styles.sub}>Tel: {membrete.telefono}</Text>
          ) : null}
        </View>

        <Text style={styles.titulo}>{titulo}</Text>

        {parrafos.map((p, i) => (
          <Text key={i} style={styles.parrafo}>
            {p}
          </Text>
        ))}

        <Text style={styles.footer}>
          Generado con Vigia Judicial — {membrete.ciudad}
        </Text>
      </Page>
    </Document>
  );
}
