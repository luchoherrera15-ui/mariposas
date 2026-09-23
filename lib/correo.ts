import "server-only";
import type { Idioma } from "./i18n/idiomas";
import { fmt } from "./i18n/idiomas";
import { TEXTOS } from "./i18n/textos";

/**
 * Correos propios del sitio, por la API de Resend. No usamos las plantillas de
 * Supabase porque el proyecto se comparte con otra app y esas plantillas llevan
 * su marca y un solo idioma.
 *
 * Variables: RESEND_API_KEY y CORREO_REMITENTE, por ejemplo
 *   CORREO_REMITENTE="Tropical Butterfly Exports <acceso@tropicalbutterflies.lat>"
 * El dominio del remitente tiene que estar verificado en Resend.
 */
export function hayCorreo() {
  return Boolean(process.env.RESEND_API_KEY && process.env.CORREO_REMITENTE);
}

export async function enviarCodigoPorCorreo({
  email,
  codigo,
  idioma,
  marca,
}: {
  email: string;
  codigo: string;
  idioma: Idioma;
  marca: string;
}) {
  const t = TEXTOS[idioma].correoCodigo;
  const html = `<div style="margin:0 auto;max-width:480px;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#1d1d1b;">
  <p style="margin:0;font-size:15px;letter-spacing:0.2px;">${escapar(marca)}</p>
  <h1 style="margin:28px 0 0;font-size:24px;font-weight:400;">${escapar(t.titulo)}</h1>
  <p style="margin:12px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#5b6166;">${escapar(t.texto)}</p>
  <p style="margin:24px 0;padding:18px;border:1px solid #dcd8cf;text-align:center;font-family:'Courier New',monospace;font-size:32px;letter-spacing:10px;">${escapar(codigo)}</p>
  <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a8f93;">${escapar(t.ignorar)}</p>
</div>`;

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CORREO_REMITENTE,
      to: [email],
      subject: fmt(t.asunto, { codigo }),
      html,
      text: `${t.titulo}\n\n${codigo}\n\n${t.texto}\n\n${t.ignorar}`,
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`Resend ${respuesta.status}: ${await respuesta.text()}`);
  }
}

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
