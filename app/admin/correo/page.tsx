import type { Metadata } from "next";
import Link from "next/link";
import NavCorreo from "@/components/admin/NavCorreo";
import { buzonConfigurado, contarSinLeer, listarHilos, remitenteBuzon, type Carpeta } from "@/lib/buzon";
import { modoDemo } from "@/lib/config";

export const metadata: Metadata = { title: "Correo" };
export const dynamic = "force-dynamic";

const CUANDO = new Intl.DateTimeFormat("es-CR", { day: "2-digit", month: "short", timeZone: "America/Costa_Rica" });
const HORA = new Intl.DateTimeFormat("es-CR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Costa_Rica" });

function cuando(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  return d.toDateString() === hoy.toDateString() ? HORA.format(d) : CUANDO.format(d);
}

export default async function BandejaCorreo({
  searchParams,
}: {
  searchParams: Promise<{ carpeta?: string; q?: string }>;
}) {
  const { carpeta: c, q = "" } = await searchParams;
  const carpeta: Carpeta = c === "enviados" || c === "archivo" ? c : "entrada";

  if (modoDemo) {
    return (
      <div className="space-y-4">
        <h1 className="titulo-2">Correo</h1>
        <p className="text-pizarra">El buzón necesita Supabase configurado; en modo demostración no hay correos.</p>
      </div>
    );
  }

  const [hilos, sinLeer] = await Promise.all([listarHilos(carpeta, q), contarSinLeer()]);
  const titulo = { entrada: "Recibidos", enviados: "Enviados", archivo: "Archivados" }[carpeta];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-2">Correo</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          Buzón de <span className="datos">{remitenteBuzon() || "info@"}</span>. Lo que llega acá también te llega a
          Gmail; lo que respondés desde acá sale desde el correo del sitio.
        </p>
        {!buzonConfigurado() ? (
          <p className="mt-4 inline-block border-l-2 border-morpho bg-nube px-4 py-2 text-sm">
            Para poder enviar falta configurar RESEND_API_KEY y CORREO_BUZON en Vercel.
          </p>
        ) : null}
      </div>

      <NavCorreo activa={carpeta} sinLeer={sinLeer} />

      <form className="flex gap-2">
        {carpeta !== "entrada" ? <input type="hidden" name="carpeta" value={carpeta} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por asunto, remitente o texto"
          className="w-full max-w-md border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta"
        />
        <button className="border border-linea px-4 py-2 text-sm hover:border-tinta">Buscar</button>
      </form>

      <div className="border border-linea bg-papel">
        {hilos.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-pizarra">
            {q ? "No hay correos que coincidan con la búsqueda." : `No hay correos en ${titulo.toLowerCase()}.`}
          </p>
        ) : (
          <ul className="divide-y divide-linea">
            {hilos.map((h) => (
              <li key={h.hilo_id}>
                <Link
                  href={`/admin/correo/${h.hilo_id}`}
                  className="flex items-baseline gap-4 px-5 py-3.5 transition-colors hover:bg-nube"
                >
                  <span className={`w-56 shrink-0 truncate text-sm ${h.sinLeer ? "font-semibold" : ""}`}>
                    {h.contacto}
                    {h.cantidad > 1 ? <span className="datos ml-1.5 text-xs text-pizarra">{h.cantidad}</span> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className={h.sinLeer ? "font-semibold" : ""}>{h.ultimo.asunto}</span>
                    <span className="text-pizarra"> — {(h.ultimo.texto ?? "").replace(/\s+/g, " ").slice(0, 140)}</span>
                  </span>
                  {h.sinLeer ? <span className="h-2 w-2 shrink-0 rounded-full bg-morpho" aria-label="sin leer" /> : null}
                  <span className="datos w-16 shrink-0 text-right text-xs text-pizarra">{cuando(h.ultimo.creado_en)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
