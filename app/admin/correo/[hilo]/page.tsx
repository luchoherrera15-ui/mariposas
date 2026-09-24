import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EditorCorreo from "@/components/admin/EditorCorreo";
import FormularioAccion from "@/components/admin/FormularioAccion";
import VistaCorreo from "@/components/admin/VistaCorreo";
import { Campo } from "@/components/admin/campos";
import { usuarioAdmin } from "@/lib/admin";
import { buzonConfigurado, obtenerFirma, obtenerHilo, remitenteBuzon, urlAdjunto, type Correo } from "@/lib/buzon";
import { tamano } from "@/lib/correo-compartido";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import { archivarHilo, enviarCorreo, marcarHilo } from "../acciones";

export const metadata: Metadata = { title: "Conversación" };
export const dynamic = "force-dynamic";

const FECHA = new Intl.DateTimeFormat("es-CR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Costa_Rica",
});

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** HTML a mostrar: el guardado o, si el correo vino solo en texto, ese texto. */
function htmlDe(c: Correo) {
  if (c.html?.trim()) return c.html;
  return `<div style="white-space:pre-wrap">${escapar(c.texto || "(sin texto)")}</div>`;
}

export default async function ConversacionCorreo({
  params,
  searchParams,
}: {
  params: Promise<{ hilo: string }>;
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { hilo } = await params;
  const { enviado } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(hilo)) notFound();

  const [correos, admin] = await Promise.all([obtenerHilo(hilo), usuarioAdmin()]);
  if (!correos.length) notFound();

  // Abrir la conversación la marca como leída.
  if (correos.some((c) => c.direccion === "entrante" && !c.leido)) {
    await supabaseAdmin().from("correos").update({ leido: true }).eq("hilo_id", hilo).eq("direccion", "entrante");
  }

  // Enlaces temporales para descargar cada adjunto guardado.
  const enlaces = new Map<string, string>();
  await Promise.all(
    correos.flatMap((c) =>
      (c.adjuntos ?? []).map(async (a) => {
        if (!a.ruta) return;
        const url = await urlAdjunto(a.ruta, a.nombre);
        if (url) enlaces.set(a.ruta, url);
      }),
    ),
  );

  const firma = admin ? await obtenerFirma(admin.id) : "";
  const ultimo = correos[correos.length - 1];
  const ultimoEntrante = [...correos].reverse().find((c) => c.direccion === "entrante") ?? null;
  const responderA = ultimoEntrante ?? ultimo;
  const miCorreo = remitenteBuzon().match(/<([^>]+)>/)?.[1]?.toLowerCase() ?? "";
  const destinatario =
    responderA.direccion === "entrante"
      ? responderA.de_email
      : responderA.para.filter((p) => p.toLowerCase() !== miCorreo).join(", ");
  const asunto = /^re:/i.test(responderA.asunto) ? responderA.asunto : `Re: ${responderA.asunto}`;
  const archivado = correos.every((c) => c.archivado);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin/correo" className="mr-auto text-sm text-pizarra hover:text-tinta">
          ← Volver
        </Link>
        <form action={marcarHilo}>
          <input type="hidden" name="hilo_id" value={hilo} />
          <input type="hidden" name="leido" value="false" />
          <button className="border border-linea bg-papel px-3 py-1.5 text-sm hover:border-tinta">Marcar sin leer</button>
        </form>
        <form action={archivarHilo}>
          <input type="hidden" name="hilo_id" value={hilo} />
          <input type="hidden" name="archivado" value={archivado ? "false" : "true"} />
          <button className="border border-linea bg-papel px-3 py-1.5 text-sm hover:border-tinta">
            {archivado ? "Sacar del archivo" : "Archivar"}
          </button>
        </form>
      </div>

      <h1 className="titulo-3 break-words">{correos[0].asunto || "(sin asunto)"}</h1>

      {enviado ? <p className="border-l-2 border-hoja bg-nube px-4 py-2 text-sm">Correo enviado.</p> : null}

      <ol className="space-y-3">
        {correos.map((c) => {
          const saliente = c.direccion === "saliente";
          const nombre = saliente ? c.de_nombre || "Tropical Butterfly Exports" : c.de_nombre || c.de_email;
          return (
            <li key={c.id} className="border border-linea bg-papel">
              <div className="flex flex-wrap items-start gap-3 px-5 pt-4">
                <span
                  aria-hidden
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium text-papel ${
                    saliente ? "bg-morpho" : "bg-noche"
                  }`}
                >
                  {nombre.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <span className="font-semibold">{nombre}</span>{" "}
                    <span className="text-pizarra">&lt;{c.de_email}&gt;</span>
                  </p>
                  <p className="text-xs text-pizarra">
                    para {c.para.join(", ")}
                    {c.cc.length ? ` · cc ${c.cc.join(", ")}` : ""}
                  </p>
                </div>
                <span className="datos whitespace-nowrap text-xs text-pizarra">{FECHA.format(new Date(c.creado_en))}</span>
              </div>

              <div className="px-5 pb-4 pl-[4.25rem] pt-3 max-sm:pl-5">
                <VistaCorreo html={htmlDe(c)} titulo={c.asunto} />

                {c.adjuntos?.length ? (
                  <div className="mt-4 border-t border-linea pt-3">
                    <p className="text-xs text-pizarra">
                      {c.adjuntos.length === 1 ? "1 adjunto" : `${c.adjuntos.length} adjuntos`}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {c.adjuntos.map((a, i) => {
                        const url = a.ruta ? enlaces.get(a.ruta) : null;
                        const contenido = (
                          <>
                            <span className="datos grid size-8 shrink-0 place-items-center bg-nube text-[0.6rem] uppercase text-pizarra">
                              {(a.nombre.split(".").pop() ?? "").slice(0, 4) || "arch"}
                            </span>
                            <span className="min-w-0">
                              <span className="block max-w-52 truncate">{a.nombre}</span>
                              <span className="datos text-xs text-pizarra">{tamano(a.bytes)}</span>
                            </span>
                          </>
                        );
                        return (
                          <li key={`${c.id}-${i}`}>
                            {url ? (
                              <a
                                href={url}
                                className="flex items-center gap-2.5 border border-linea px-2.5 py-2 text-sm transition-colors hover:border-tinta"
                              >
                                {contenido}
                              </a>
                            ) : (
                              <span
                                title="Este adjunto no se guardó en el panel: abrilo desde Gmail."
                                className="flex items-center gap-2.5 border border-dashed border-linea px-2.5 py-2 text-sm text-pizarra"
                              >
                                {contenido}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="border border-linea bg-papel p-5">
        <h2 className="text-base font-medium">Responder</h2>
        {!buzonConfigurado() ? (
          <p className="mt-2 text-sm text-pizarra">Para responder falta configurar RESEND_API_KEY y CORREO_BUZON en Vercel.</p>
        ) : (
          <FormularioAccion accion={enviarCorreo} boton="Enviar respuesta" className="mt-4 space-y-4">
            <input type="hidden" name="responder_a" value={responderA.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Para" name="para" defaultValue={destinatario} required />
              <Campo etiqueta="Cc (opcional)" name="cc" />
            </div>
            <Campo etiqueta="Asunto" name="asunto" defaultValue={asunto} />
            <EditorCorreo firmaHtml={firma} alto="min-h-48" />
            <p className="text-xs text-pizarra">El mensaje anterior se agrega citado debajo de tu respuesta.</p>
          </FormularioAccion>
        )}
      </section>
    </div>
  );
}
