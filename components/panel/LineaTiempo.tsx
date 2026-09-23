import { etiquetaEnvio, fechaHora } from "@/lib/formato";
import type { EnvioEvento, EstadoEnvio } from "@/lib/tipos";

/** Historial de eventos de un envío, del más reciente al más antiguo. */
export default function LineaTiempo({ eventos }: { eventos: EnvioEvento[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-pizarra">Todavía no hay movimientos registrados.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l border-linea pl-6">
      {eventos.map((e, indice) => {
        const actual = indice === 0;
        return (
          <li key={e.id} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[1.9rem] top-1 grid size-4 place-items-center ring-4 ring-papel ${
                actual ? "bg-morpho" : "bg-linea"
              }`}
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className={`text-sm font-semibold ${actual ? "text-morpho" : "text-tinta"}`}>
                {etiquetaEnvio[e.estado as EstadoEnvio] ?? e.estado}
              </p>
              <p className="datos text-xs text-pizarra">{fechaHora(e.ocurrido_en)}</p>
              {e.ubicacion ? <p className="text-xs font-medium text-pizarra">· {e.ubicacion}</p> : null}
            </div>
            {e.descripcion ? <p className="mt-1 text-sm text-pizarra">{e.descripcion}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
