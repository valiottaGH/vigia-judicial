/**
 * Plantillas HTML de escritos judiciales con placeholders {{variable}}.
 * `variablesDesdePerfil` rellena datos del membrete; el resto queda como [completar].
 */
export interface PlantillaEscrito {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  contenido: string;
  variables: string[];
}

export const PLANTILLAS_ESCRITOS: PlantillaEscrito[] = [
  {
    id: "escrito_simple",
    nombre: "Escrito simple",
    descripcion: "Presentacion generica ante juzgado",
    categoria: "General",
    variables: [
      "ciudad",
      "fecha",
      "juzgado",
      "expediente",
      "caratula",
      "abogado",
      "matricula",
      "estudio",
      "domicilio",
      "telefono",
      "cuerpo",
    ],
    contenido: `<p><strong>{{ciudad}}</strong>, {{fecha}}</p>
<p>Señor/a Juez/a:</p>
<p>F.S.:</p>
<p>Me dirijo a V.S. en mi carácter de letrado patrocinante de <strong>{{actor}}</strong>, en autos caratulados <strong>"{{caratula}}"</strong> (Expte. Nº <strong>{{expediente}}</strong>), a fin de {{cuerpo}}.</p>
<p>Por ello, solicito se tenga por presentado el presente escrito y se provea lo que en derecho corresponda.</p>
<p>Será justicia.</p>
<p>{{abogado}}<br/>Tº {{matricula}} Fº {{matricula_folio}} CPASF<br/>{{estudio}}<br/>{{domicilio}}<br/>{{telefono}}</p>`,
  },
  {
    id: "demanda",
    nombre: "Demanda",
    descripcion: "Demanda civil - danos y perjuicios",
    categoria: "Inicio de accion",
    variables: [
      "ciudad",
      "fecha",
      "juzgado",
      "actor",
      "demandado",
      "domicilio_actor",
      "domicilio_demandado",
      "hechos",
      "derecho",
      "petitorio",
      "prueba",
      "abogado",
      "matricula",
      "estudio",
      "domicilio",
      "telefono",
    ],
    contenido: `<p><strong>{{ciudad}}</strong>, {{fecha}}</p>
<p>Señor/a Juez/a del {{juzgado}}:</p>
<p><strong>{{actor}}</strong>, con domicilio en {{domicilio_actor}}, por derecho propio y con patrocinio letrado de <strong>{{abogado}}</strong>, Tº {{matricula}} Fº {{matricula_folio}} CPASF, constituyendo domicilio procesal en {{domicilio}}, a V.S. respetuosamente me presento y digo:</p>
<p><strong>I. OBJETO</strong></p>
<p>Vengo a promover demanda ordinaria de daños y perjuicios contra <strong>{{demandado}}</strong>, con domicilio en {{domicilio_demandado}}.</p>
<p><strong>II. HECHOS</strong></p>
<p>{{hechos}}</p>
<p><strong>III. DERECHO</strong></p>
<p>{{derecho}}</p>
<p><strong>IV. PRUEBA</strong></p>
<p>{{prueba}}</p>
<p><strong>V. PETITORIO</strong></p>
<p>{{petitorio}}</p>
<p>Por todo ello, solicito:</p>
<p>1) Se me tenga por presentado.<br/>2) Se corra traslado de la demanda.<br/>3) Oportunamente, se haga lugar a la accion.</p>
<p>Será justicia.</p>
<p>{{abogado}}<br/>Tº {{matricula}} Fº {{matricula_folio}} CPASF<br/>{{estudio}}<br/>{{domicilio}}<br/>{{telefono}}</p>`,
  },
  {
    id: "contestacion",
    nombre: "Contestacion de demanda",
    descripcion: "Contesta traslado de demanda",
    categoria: "Defensa",
    variables: [
      "ciudad",
      "fecha",
      "juzgado",
      "expediente",
      "caratula",
      "demandado",
      "actor",
      "contestacion_hechos",
      "contestacion_derecho",
      "petitorio",
      "abogado",
      "matricula",
      "estudio",
      "domicilio",
      "telefono",
    ],
    contenido: `<p><strong>{{ciudad}}</strong>, {{fecha}}</p>
<p>Señor/a Juez/a:</p>
<p><strong>{{demandado}}</strong>, en autos caratulados <strong>"{{caratula}}"</strong> (Expte. Nº <strong>{{expediente}}</strong>), promovidos por <strong>{{actor}}</strong>, a V.S. digo:</p>
<p><strong>I. PERSONERIA</strong></p>
<p>Me presento en tiempo y forma, con patrocinio letrado de {{abogado}}, Tº {{matricula}} Fº {{matricula_folio}} CPASF.</p>
<p><strong>II. CONTESTACION DE HECHOS</strong></p>
<p>{{contestacion_hechos}}</p>
<p><strong>III. CONTESTACION DE DERECHO</strong></p>
<p>{{contestacion_derecho}}</p>
<p><strong>IV. PETITORIO</strong></p>
<p>{{petitorio}}</p>
<p>Será justicia.</p>
<p>{{abogado}}<br/>Tº {{matricula}} Fº {{matricula_folio}} CPASF<br/>{{estudio}}<br/>{{domicilio}}<br/>{{telefono}}</p>`,
  },
  {
    id: "memorial",
    nombre: "Memorial informativo",
    descripcion: "Informa novedades o acompaña documentacion",
    categoria: "General",
    variables: [
      "ciudad",
      "fecha",
      "juzgado",
      "expediente",
      "caratula",
      "informacion",
      "abogado",
      "matricula",
      "estudio",
      "domicilio",
      "telefono",
    ],
    contenido: `<p><strong>{{ciudad}}</strong>, {{fecha}}</p>
<p>Señor/a Juez/a:</p>
<p>En autos <strong>"{{caratula}}"</strong> (Expte. Nº <strong>{{expediente}}</strong>), me dirijo a V.S. a fin de informar:</p>
<p>{{informacion}}</p>
<p>Solicito se tenga presente y se provea conforme a derecho.</p>
<p>Será justicia.</p>
<p>{{abogado}}<br/>Tº {{matricula}} Fº {{matricula_folio}} CPASF<br/>{{estudio}}<br/>{{domicilio}}<br/>{{telefono}}</p>`,
  },
];

export function getPlantilla(id: string): PlantillaEscrito | undefined {
  return PLANTILLAS_ESCRITOS.find((p) => p.id === id);
}

export function formatFechaLarga(date = new Date()): string {
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function aplicarVariables(
  contenido: string,
  variables: Record<string, string>
): string {
  let result = contenido;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value || `[${key}]`);
  }
  result = result.replace(/\{\{[a-z_]+\}\}/gi, "[completar]");
  return result;
}

export function variablesDesdePerfil(profile: {
  full_name?: string | null;
  estudio_nombre?: string | null;
  matricula?: string | null;
  domicilio_profesional?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
}): Record<string, string> {
  const matricula = profile.matricula ?? "";
  return {
    fecha: formatFechaLarga(),
    ciudad: profile.ciudad ?? "Santa Fe",
    abogado: profile.full_name ?? "",
    matricula,
    matricula_folio: matricula,
    estudio: profile.estudio_nombre ?? profile.full_name ?? "",
    domicilio: profile.domicilio_profesional ?? "",
    telefono: profile.telefono ?? "",
    juzgado: "[Juzgado]",
    expediente: "[Nº expediente]",
    caratula: "[Caratula]",
    actor: "[Actor]",
    demandado: "[Demandado]",
    cuerpo: "[indicar objeto del escrito]",
    hechos: "[Describir hechos]",
    derecho: "[Fundamentos de derecho]",
    prueba: "[Ofrecer prueba]",
    petitorio: "[Formular petitorio]",
    domicilio_actor: "[Domicilio actor]",
    domicilio_demandado: "[Domicilio demandado]",
    contestacion_hechos: "[Contestar hechos]",
    contestacion_derecho: "[Contestar derecho]",
    informacion: "[Informacion a comunicar]",
  };
}
