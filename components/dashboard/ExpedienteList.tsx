import type { ExpedienteConNovedades } from "@/types";

interface ExpedienteListProps {
  expedientes: ExpedienteConNovedades[];
}

export default function ExpedienteList({ expedientes }: ExpedienteListProps) {
  if (expedientes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-primary mb-2">
          Mis expedientes
        </h2>
        <p className="text-sm text-muted">
          Todavía no agregaste expedientes. Usá el formulario de arriba para
          empezar a monitorear.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-primary mb-4">
        Mis expedientes ({expedientes.length})
      </h2>
      <ul className="space-y-3">
        {expedientes.map((exp) => (
          <li
            key={exp.id}
            className="p-4 border border-border rounded-lg hover:border-primary/30 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{exp.numero}</p>
                <p className="text-xs text-muted mt-0.5">
                  {exp.jurisdiccion}
                  {exp.fuero ? ` · ${exp.fuero}` : ""}
                </p>
                {exp.caratula && (
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {exp.caratula}
                  </p>
                )}
              </div>
              {exp.novedades_no_leidas > 0 && (
                <span className="shrink-0 px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
                  {exp.novedades_no_leidas} nueva(s)
                </span>
              )}
            </div>
            {exp.ultima_consulta && (
              <p className="text-xs text-muted mt-2">
                Última consulta:{" "}
                {new Date(exp.ultima_consulta).toLocaleString("es-AR")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
