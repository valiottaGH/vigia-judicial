import type { CampoExtraccion, PlantillaSistema } from "./types";

export const PLANTILLAS_SISTEMA: PlantillaSistema[] = [
  {
    key: "general",
    nombre: "Análisis general",
    descripcion: "Partes, montos, fechas y objeto del trámite",
    campos: [
      { id: "partes", label: "Partes", descripcion: "Actores, demandados, terceros mencionados" },
      { id: "montos", label: "Montos", descripcion: "Sumas, indemnizaciones, honorarios, multas" },
      { id: "fechas", label: "Fechas clave", descripcion: "Vencimientos, audiencias, plazos procesales" },
      { id: "objeto", label: "Objeto / trámite", descripcion: "De qué trata el documento o resolución" },
      { id: "resumen", label: "Resumen", descripcion: "Síntesis en 2-3 oraciones" },
    ],
  },
  {
    key: "contratos",
    nombre: "Contratos",
    descripcion: "Cláusulas, partes, montos y plazos contractuales",
    campos: [
      { id: "partes", label: "Partes", descripcion: "Firmantes o partes del contrato" },
      { id: "objeto", label: "Objeto", descripcion: "Objeto del contrato" },
      { id: "montos", label: "Montos", descripcion: "Precio, penalidades, ajustes" },
      { id: "plazos", label: "Plazos", descripcion: "Vigencia, entregas, vencimientos" },
      { id: "clausulas", label: "Cláusulas relevantes", descripcion: "Cláusulas críticas o inusuales" },
    ],
  },
  {
    key: "sentencias",
    nombre: "Sentencias / resoluciones",
    descripcion: "Fallo, partes, montos y plazos judiciales",
    campos: [
      { id: "tipo", label: "Tipo de resolución", descripcion: "Sentencia, auto, decreto, providencia" },
      { id: "partes", label: "Partes", descripcion: "Partes involucradas" },
      { id: "fallo", label: "Fallo / decisión", descripcion: "Qué resolvió el tribunal" },
      { id: "montos", label: "Montos", descripcion: "Condena, costas, honorarios regulados" },
      { id: "plazos", label: "Plazos", descripcion: "Plazos para cumplir o apelar" },
    ],
  },
];

export function getPlantillaSistema(key: string | null | undefined): PlantillaSistema | null {
  if (!key) return null;
  return PLANTILLAS_SISTEMA.find((p) => p.key === key) ?? null;
}

export function camposDesdePlantilla(input: {
  plantillaKey?: string | null;
  plantillaCampos?: CampoExtraccion[] | null;
}): CampoExtraccion[] {
  if (input.plantillaCampos && input.plantillaCampos.length > 0) {
    return input.plantillaCampos;
  }
  const sistema = getPlantillaSistema(input.plantillaKey);
  return sistema?.campos ?? PLANTILLAS_SISTEMA[0].campos;
}
