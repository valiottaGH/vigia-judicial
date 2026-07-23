import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const system = fs.readFileSync(
  path.join(__dirname, "../lib/cedulas/interpret-notificacion-ai.ts"),
  "utf8"
);
const systemMatch = system.match(/return \[([\s\S]*?)\]\.join/);
const systemText = systemMatch
  ? eval("[" + systemMatch[1].replace(/\n/g, "") + "].join('\\n')")
  : "";

function estTokens(text) {
  return Math.ceil(text.length / 3.5);
}

const schema = `{
  "tipo_tramite": "peritos",
  "tipo_documento": "cedula",
  "resumen": "una oracion",
  "texto_proveido": "texto del proveido",
  "texto_respuesta": "cuerpo de la respuesta para el documento",
  "fecha_resolucion": "YYYY-MM-DD o null",
  "juzgado": "nombre del juzgado o null",
  "jurisdiccion": "provincia o null",
  "partes": [
    { "nombre": "Juan", "apellido": "Perez", "rol": "demandado", "domicilio": "...", "notificar": true }
  ],
  "variables_carta": { "destinatario": "...", "domicilio_destinatario": "...", "monto": "...", "concepto": "...", "plazo": "..." }
}`;

function buildUser(doc) {
  return `Expediente Nº 21 12156800 7
Carátula: Pérez c/ Gómez s/ Daños y Perjuicios

Texto del proveído / notificación judicial:
---
${doc}
---

Devolvé JSON:
${schema}`;
}

const docSamples = {
  corto:
    "PROVEÍDO: Téngase presente el escrito de fecha 15/03/2026. Desígnase perito contador de oficio al Dr. García. Intímase al actor para que acompañe el domicilio procesal en 5 días.",
  tipico: `Juzgado de Primera Instancia en lo Civil y Comercial N° 5 - Santa Fe. Expte N° 21-12156800-7. PÉREZ, Juan c/ GÓMEZ, María s/ DAÑOS Y PERJUICIOS. PROVEÍDO: Vista la presentación efectuada por el letrado de la parte actora, y atento a lo solicitado, RESUELVO: 1) Correr traslado de la demanda por el término de quince días. 2) Intimar a la parte demandada para que comparezca y conteste demanda bajo apercibimiento de rebeldía. 3) Tener presente el domicilio constituido en calle San Martín 1234. Notifíquese conforme arts. 132 y 133 LPO. Fdo: Dr. Martínez, Juez.
`.repeat(2),
  largo:
    ("Provincia de Santa Fe. Poder Judicial. Juzgado Civil y Comercial N° 5. ".repeat(8) +
      "PROVEÍDO: " +
      "Texto judicial extenso con referencias a artículos, plazos, peritos, traslados y notificaciones a múltiples partes. ".repeat(
        90
      )),
};

const outputSamples = {
  corto: 450,
  tipico: 800,
  largo: 1200,
};

const systemTokens = estTokens(systemText);
console.log("Modelo default: gpt-4o-mini (OpenRouter)");
console.log("Llamadas IA por generacion: 1");
console.log("");
console.log("System prompt:", systemText.length, "chars ->", systemTokens, "tokens");

for (const [name, doc] of Object.entries(docSamples)) {
  const user = buildUser(doc);
  const inputTokens = systemTokens + estTokens(user);
  const outputTokens = outputSamples[name];
  const total = inputTokens + outputTokens;
  const costIn = (inputTokens / 1e6) * 0.15;
  const costOut = (outputTokens / 1e6) * 0.6;
  const cost = costIn + costOut;
  console.log("");
  console.log("---", name.toUpperCase(), "---");
  console.log("  Documento extraido:", doc.length, "chars (~", estTokens(doc), "tokens)");
  console.log("  Input total: ~", inputTokens, "tokens");
  console.log("  Output total: ~", outputTokens, "tokens");
  console.log("  TOTAL: ~", total, "tokens");
  console.log("  Costo USD: ~$", cost.toFixed(4), "(in $", costIn.toFixed(4), "+ out $", costOut.toFixed(4), ")");
  console.log("  Costo ARS @1400: ~$", Math.round(cost * 1400), "por generacion");
}

const avgInput = systemTokens + estTokens(buildUser(docSamples.tipico));
const avgOutput = 800;
const avgTotal = avgInput + avgOutput;
const avgCost = (avgInput / 1e6) * 0.15 + (avgOutput / 1e6) * 0.6;
console.log("");
console.log("=== PROMEDIO REALISTA (proveido tipico 1-2 pag) ===");
console.log("~", avgTotal, "tokens -> ~$", avgCost.toFixed(4), "USD -> ~$", Math.round(avgCost * 1400), "ARS");

console.log("");
console.log("=== PRICING SUGERENCIAS (margen sobre costo IA) ===");
for (const gens of [5, 50, 200]) {
  const costMonth = avgCost * gens;
  console.log(
    gens,
    "gen/mes costo IA: $",
    costMonth.toFixed(2),
    "USD | Pro sugerido 5x: $",
    (costMonth * 5).toFixed(2),
    "USD/mes"
  );
}
