import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { Area, Campo } from "@/components/admin/campos";
import { buzonConfigurado, obtenerHilo, remitenteBuzon, type Correo } from "@/lib/buzon";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import { archivarHilo, enviarCorreo, marcarHilo } from "../acciones";

export const metadata: Metadata = { title: "Conversación" };
export const dynamic = "force-dynamic";

const FECHA = new Intl.DateTimeFormat("es-CR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Costa_Rica",
});

function kb(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** El HTML de afuera va en un iframe sin scripts ni formularios. */
function CuerpoCorreo({ correo }: { correo: Correo }) {
  if (correo.html && correo.direccion === "entrante") {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1d1d1b;word-wrap:break-word}img{max-width:100%;height:auto}</style></head><body>${correo.html}</body></html>`;
    return (
      <iframe
        title={correo.asunto}
        srcDoc={doc}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        className="h-[28rem] w-full border-0 bg-white"
      />
    );
  }
  return <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{correo.texto || "(sin texto)"}</pre>;
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

  const correos = await obtenerHilo(hilo);
  if (!correos.length) notFound();

  // Abrir la conversación la marca como leída.
  if (correos.some((c) => c.direccion === "entrante" && !c.leido)) {
    await supabaseAdmin().from("correos").update({ leido: true }).eq("hilo_id", hilo).eq("direccion", "entrante");
  }

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <Link href="/admin/correo" className="text-sm text-pizarra hover:text-tinta">
            ← Volver al correo
          </Link>
          <h1 className="titulo-2 mt-2 break-words">{correos[0].asunto}</h1>
        </div>
        <div className="flex gap-2">
          <form action={marcarHilo}>
            <input type="hidden" name="hilo_id" value={hilo} />
            <input type="hidden" name="leido" value="false" />
            <button className="border border-linea px-3 py-2 text-sm hover:border-tinta">Marcar sin leer</button>
          </form>
          <form action={archivarHilo}>
            <input type="hidden" name="hilo_id" value={hilo} />
            <input type="hidden" name="archivado" value={archivado ? "false" : "true"} />
            <button className="border border-linea px-3 py-2 text-sm hover:border-tinta">
              {archivado ? "Sacar del archivo" : "Archivar"}
            </button>
          </form>
        </div>
      </div>

      {enviado ? <p className="inline-block border-l-2 border-hoja bg-nube px-4 py-2 text-sm">Correo enviado.</p> : null}

      <ol className="space-y-4">
        {correos.map((c) => (
          <li
            key={c.id}
            className={`border bg-papel ${c.direccion === "saliente" ? "border-morpho/40" : "border-linea"}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-linea px-5 py-3 text-sm">
              <span className="font-medium">
                {c.direccion === "saliente" ? "Vos" : c.de_nombre || c.de_email}
              </span>
              <span className="text-pizarra">
                {c.direccion === "saliente" ? `para ${c.para.join(", ")}` : `<${c.de_email}>`}
                {c.cc.length ? ` · cc ${c.cc.join(", ")}` : ""}
              </span>
              <span className="datos ml-auto text-xs text-pizarra">{FECHA.format(new Date(c.creado_en))}</span>
            </div>
            <div className="px-5 py-4">
              <CuerpoCorreo correo={c} />
              {c.adjuntos?.length ? (
                <p className="mt-4 text-xs text-pizarra">
                  Adjuntos (abrilos desde Gmail):{" "}
                  {c.adjuntos.map((a) => `${a.nombre} · ${kb(a.bytes)}`).join(" — ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
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
            <Area etiqueta="Mensaje" name="cuerpo" rows={8} required autoFocus />
          </FormularioAccion>
        )}
      </section>
    </div>
  );
}
