import type { Metadata } from "next";
import Link from "next/link";
import { buzonConfigurado, listarHilos, type Carpeta } from "@/lib/buzon";

export const metadata: Metadata = { title: "Correo" };
export const dynamic = "force-dynamic";

const ZONA = "America/Costa_Rica";
const HORA = new Intl.DateTimeFormat("es-CR", { hour: "numeric", minute: "2-digit", timeZone: ZONA });
const DIA = new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short", timeZone: ZONA });
const FECHA = new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: ZONA });
const CLAVE_DIA = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA });

/** Como en Gmail: hora si es de hoy, día y mes si es de este año, fecha corta si no. */
function cuando(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  if (CLAVE_DIA.format(d) === CLAVE_DIA.format(hoy)) return HORA.format(d);
  if (d.getFullYear() === hoy.getFullYear()) return DIA.format(d);
  return FECHA.format(d);
}

const TITULOS: Record<Carpeta, string> = { entrada: "Recibidos", enviados: "Enviados", archivo: "Archivados" };

export default async function BandejaCorreo({
  searchParams,
}: {
  searchParams: Promise<{ carpeta?: string; q?: string }>;
}) {
  const { carpeta: c, q = "" } = await searchParams;
  const carpeta: Carpeta = c === "enviados" || c === "archivo" ? c : "entrada";
  const hilos = await listarHilos(carpeta, q);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="titulo-3 mr-auto">{TITULOS[carpeta]}</h1>
        <form className="flex w-full max-w-sm">
          {carpeta !== "entrada" ? <input type="hidden" name="carpeta" value={carpeta} /> : null}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar correo"
            className="w-full border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta"
          />
          <button className="border border-l-0 border-linea px-3.5 text-sm hover:bg-nube">Buscar</button>
        </form>
      </div>

      {!buzonConfigurado() ? (
        <p className="border-l-2 border-morpho bg-nube px-4 py-2 text-sm">
          Para poder enviar falta configurar RESEND_API_KEY y CORREO_BUZON en Vercel.
        </p>
      ) : null}

      <div className="border border-linea bg-papel">
        {hilos.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-pizarra">
            {q ? "Ningún correo coincide con la búsqueda." : `No hay correos en ${TITULOS[carpeta].toLowerCase()}.`}
          </p>
        ) : (
          <ul className="divide-y divide-linea">
            {hilos.map((h) => {
              const nuevo = h.sinLeer > 0;
              return (
                <li key={h.hilo_id}>
                  <Link
                    href={`/admin/correo/${h.hilo_id}`}
                    className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-4 py-3 transition-colors hover:bg-nube/70 sm:grid-cols-[13rem_minmax(0,1fr)_auto] ${
                      nuevo ? "bg-papel" : "bg-lino/40"
                    }`}
                  >
                    <span className={`flex min-w-0 items-center gap-2 text-sm ${nuevo ? "font-semibold text-tinta" : "text-tinta/85"}`}>
                      <span
                        aria-label={nuevo ? "sin leer" : undefined}
                        className={`size-2 shrink-0 rounded-full ${nuevo ? "bg-morpho" : "bg-transparent"}`}
                      />
                      <span className="truncate">{h.contacto}</span>
                      {h.cantidad > 1 ? <span className="datos shrink-0 text-xs font-normal text-pizarra">{h.cantidad}</span> : null}
                    </span>

                    <span className="col-span-2 row-start-2 flex min-w-0 items-center gap-2 pl-4 text-sm sm:col-span-1 sm:row-start-auto sm:pl-0">
                      <span className="min-w-0 truncate">
                        <span className={nuevo ? "font-semibold text-tinta" : "text-tinta/85"}>
                          {h.ultimo.asunto || "(sin asunto)"}
                        </span>
                        {h.extracto ? <span className="text-pizarra"> — {h.extracto}</span> : null}
                      </span>
                      {h.conAdjuntos ? (
                        <svg aria-label="con adjuntos" viewBox="0 0 24 24" className="size-4 shrink-0 text-pizarra" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="m21 11-8.6 8.6a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 0 1 4.7 4.7L10 17.3a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />
                        </svg>
                      ) : null}
                    </span>

                    <span className={`datos row-start-1 whitespace-nowrap text-right text-xs sm:row-start-auto ${nuevo ? "font-semibold text-tinta" : "text-pizarra"}`}>
                      {cuando(h.ultimo.creado_en)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
