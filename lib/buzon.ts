import "server-only";
import PostalMime from "postal-mime";
import { supabaseAdmin } from "./supabase-servidor";

/**
 * Buzón de info@ para /admin/correo.
 *
 * Entrada: Cloudflare Email Routing → Email Worker → POST /api/correo/entrante
 * con el correo crudo (RFC 822). El Worker además lo reenvía a Gmail.
 * Salida: API de Resend, desde CORREO_BUZON (o CORREO_REMITENTE si no está).
 *
 * Las conversaciones se agrupan por `hilo_id`: primero por las cabeceras
 * In-Reply-To / References y, si no coinciden, por asunto + remitente.
 */

export type Adjunto = { nombre: string; tipo: string; bytes: number };

export type Correo = {
  id: string;
  hilo_id: string;
  direccion: "entrante" | "saliente";
  de_email: string;
  de_nombre: string | null;
  para: string[];
  cc: string[];
  asunto: string;
  texto: string | null;
  html: string | null;
  message_id: string | null;
  en_respuesta_a: string | null;
  referencias: string[];
  adjuntos: Adjunto[];
  leido: boolean;
  archivado: boolean;
  creado_en: string;
};

export type Carpeta = "entrada" | "enviados" | "archivo";

export function buzonConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && (process.env.CORREO_BUZON || process.env.CORREO_REMITENTE));
}

/** "Tropical Butterfly Exports <info@tropicalbutterflies.lat>" */
export function remitenteBuzon() {
  return process.env.CORREO_BUZON || process.env.CORREO_REMITENTE || "";
}

function emailDe(remitente: string) {
  const m = remitente.match(/<([^>]+)>/);
  return (m ? m[1] : remitente).trim().toLowerCase();
}

/** Quita Re:, RE:, Fwd:, RV:, etc. para comparar asuntos. */
export function asuntoBase(asunto: string) {
  return asunto.replace(/^\s*((re|rv|fw|fwd|aw|tr)\s*(\[\d+\])?\s*:\s*)+/i, "").trim().toLowerCase();
}

// ─── Lecturas ────────────────────────────────────────────────────────────────

export type ResumenHilo = {
  hilo_id: string;
  ultimo: Correo;
  cantidad: number;
  sinLeer: number;
  contacto: string;
};

/** Una fila por conversación, la más reciente arriba. */
export async function listarHilos(carpeta: Carpeta, busqueda = ""): Promise<ResumenHilo[]> {
  let consulta = supabaseAdmin()
    .from("correos")
    .select("*")
    .order("creado_en", { ascending: false })
    .limit(500);

  if (carpeta === "archivo") consulta = consulta.eq("archivado", true);
  else consulta = consulta.eq("archivado", false);

  const q = busqueda.trim();
  if (q) {
    const patron = `%${q.replace(/[%_,()]/g, " ")}%`;
    consulta = consulta.or(`asunto.ilike.${patron},de_email.ilike.${patron},de_nombre.ilike.${patron},texto.ilike.${patron}`);
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("listarHilos:", error.message);
    return [];
  }

  const hilos = new Map<string, ResumenHilo>();
  for (const c of (data ?? []) as Correo[]) {
    let h = hilos.get(c.hilo_id);
    if (!h) {
      h = { hilo_id: c.hilo_id, ultimo: c, cantidad: 0, sinLeer: 0, contacto: "" };
      hilos.set(c.hilo_id, h);
    }
    h.cantidad += 1;
    if (c.direccion === "entrante" && !c.leido) h.sinLeer += 1;
    if (!h.contacto) h.contacto = c.direccion === "entrante" ? c.de_nombre || c.de_email : `Para: ${c.para.join(", ")}`;
  }

  const todos = [...hilos.values()];
  if (carpeta === "entrada") {
    // Conversaciones donde alguien nos escribió.
    const conEntrada = new Set(((data ?? []) as Correo[]).filter((c) => c.direccion === "entrante").map((c) => c.hilo_id));
    return todos.filter((h) => conEntrada.has(h.hilo_id));
  }
  if (carpeta === "enviados") {
    const conSalida = new Set(((data ?? []) as Correo[]).filter((c) => c.direccion === "saliente").map((c) => c.hilo_id));
    return todos.filter((h) => conSalida.has(h.hilo_id));
  }
  return todos;
}

export async function obtenerHilo(hiloId: string): Promise<Correo[]> {
  const { data, error } = await supabaseAdmin()
    .from("correos")
    .select("*")
    .eq("hilo_id", hiloId)
    .order("creado_en", { ascending: true });
  if (error) console.error("obtenerHilo:", error.message);
  return (data ?? []) as Correo[];
}

export async function contarSinLeer() {
  const { count } = await supabaseAdmin()
    .from("correos")
    .select("id", { count: "exact", head: true })
    .eq("direccion", "entrante")
    .eq("leido", false)
    .eq("archivado", false);
  return count ?? 0;
}

// ─── Hilos ───────────────────────────────────────────────────────────────────

async function buscarHilo({
  ids,
  asunto,
  contacto,
}: {
  ids: string[];
  asunto: string;
  contacto: string;
}): Promise<string | null> {
  const admin = supabaseAdmin();
  const limpios = ids.filter(Boolean);
  if (limpios.length) {
    const { data } = await admin.from("correos").select("hilo_id").in("message_id", limpios).limit(1);
    if (data?.[0]?.hilo_id) return data[0].hilo_id as string;
  }

  // Sin cabeceras útiles: mismo asunto con la misma persona en los últimos 60 días.
  const base = asuntoBase(asunto);
  if (!base || !contacto) return null;
  const desde = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const { data } = await admin
    .from("correos")
    .select("hilo_id, asunto, de_email, para")
    .gte("creado_en", desde)
    .or(`de_email.eq.${contacto},para.cs.{${contacto}}`)
    .order("creado_en", { ascending: false })
    .limit(50);
  const igual = (data ?? []).find((c) => asuntoBase(String(c.asunto)) === base);
  return (igual?.hilo_id as string) ?? null;
}

// ─── Entrada ─────────────────────────────────────────────────────────────────

const limpiarId = (v?: string | null) => (v ? v.trim() : null);

/** Guarda un correo crudo recibido por el Worker. Devuelve el id nuevo. */
export async function guardarEntrante(crudo: ArrayBuffer, sobre: { de?: string | null; para?: string | null }) {
  const correo = await PostalMime.parse(crudo);

  const de_email = (correo.from?.address || sobre.de || "").toLowerCase();
  const para = (correo.to ?? []).map((d) => d.address).filter(Boolean) as string[];
  if (!para.length && sobre.para) para.push(sobre.para);
  const cc = (correo.cc ?? []).map((d) => d.address).filter(Boolean) as string[];
  const message_id = limpiarId(correo.messageId);
  const en_respuesta_a = limpiarId(correo.inReplyTo);
  const referencias = (correo.references ?? "").split(/\s+/).map((r) => r.trim()).filter(Boolean);

  const admin = supabaseAdmin();

  // El Worker puede reintentar: si ya lo tenemos, no lo duplicamos.
  if (message_id) {
    const { data: ya } = await admin.from("correos").select("id").eq("message_id", message_id).maybeSingle();
    if (ya) return ya.id as string;
  }

  const hilo =
    (await buscarHilo({
      ids: [en_respuesta_a ?? "", ...referencias],
      asunto: correo.subject ?? "",
      contacto: de_email,
    })) ?? null;

  const adjuntos = (correo.attachments ?? []).map((a) => ({
    nombre: a.filename || "adjunto",
    tipo: a.mimeType || "application/octet-stream",
    bytes: typeof a.content === "string" ? a.content.length : (a.content as ArrayBuffer).byteLength,
  }));

  const id = crypto.randomUUID();
  const { error } = await admin.from("correos").insert({
    id,
    hilo_id: hilo ?? id,
    direccion: "entrante",
    de_email,
    de_nombre: correo.from?.name || null,
    para,
    cc,
    asunto: correo.subject ?? "(sin asunto)",
    texto: correo.text ?? null,
    html: correo.html ?? null,
    message_id,
    en_respuesta_a,
    referencias,
    adjuntos,
  });
  if (error) throw new Error(`No se pudo guardar el correo: ${error.message}`);
  return id;
}

// ─── Salida ──────────────────────────────────────────────────────────────────

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Texto plano → HTML sencillo, con la cita del correo anterior si la hay. */
function aHtml(cuerpo: string, cita?: Correo | null) {
  const parrafos = escapar(cuerpo).replace(/\r?\n/g, "<br>");
  let html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#1d1d1b;">${parrafos}</div>`;
  if (cita) {
    const quien = cita.de_nombre ? `${cita.de_nombre} <${cita.de_email}>` : cita.de_email;
    const cuando = new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Costa_Rica" }).format(new Date(cita.creado_en));
    const anterior = escapar(cita.texto ?? "").replace(/\r?\n/g, "<br>");
    html += `<br><div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#5b6166;">El ${escapar(cuando)}, ${escapar(quien)} escribió:</div><blockquote style="margin:6px 0 0;padding-left:12px;border-left:2px solid #dcd8cf;color:#5b6166;font-size:13px;">${anterior}</blockquote>`;
  }
  return html;
}

function aTextoCitado(cuerpo: string, cita?: Correo | null) {
  if (!cita?.texto) return cuerpo;
  const quien = cita.de_nombre ? `${cita.de_nombre} <${cita.de_email}>` : cita.de_email;
  const citado = cita.texto.split(/\r?\n/).map((l) => `> ${l}`).join("\n");
  return `${cuerpo}\n\n${quien} escribió:\n${citado}`;
}

const lista = (v: string) =>
  v
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);

const emailValido = (v: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);

export async function enviarDesdeBuzon({
  para,
  cc,
  asunto,
  cuerpo,
  responderA,
  usuarioId,
}: {
  para: string;
  cc?: string;
  asunto: string;
  cuerpo: string;
  /** id del correo al que se responde (para el hilo y la cita). */
  responderA?: string | null;
  usuarioId?: string | null;
}) {
  const destinatarios = lista(para);
  const copias = lista(cc ?? "");
  const invalidos = [...destinatarios, ...copias].filter((d) => !emailValido(d));
  if (!destinatarios.length) throw new Error("Escribí al menos un destinatario.");
  if (invalidos.length) throw new Error(`Revisá estas direcciones: ${invalidos.join(", ")}`);
  if (!cuerpo.trim()) throw new Error("El mensaje está vacío.");

  const admin = supabaseAdmin();
  let original: Correo | null = null;
  if (responderA) {
    const { data } = await admin.from("correos").select("*").eq("id", responderA).maybeSingle();
    original = (data as Correo) ?? null;
  }

  const desde = remitenteBuzon();
  const miDominio = emailDe(desde).split("@")[1] ?? "localhost";
  const id = crypto.randomUUID();
  const message_id = `<${id}@${miDominio}>`;

  const headers: Record<string, string> = { "Message-ID": message_id };
  let referencias: string[] = [];
  if (original?.message_id) {
    referencias = [...(original.referencias ?? []), original.message_id];
    headers["In-Reply-To"] = original.message_id;
    headers["References"] = referencias.join(" ");
  }

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: desde,
      to: destinatarios,
      cc: copias.length ? copias : undefined,
      reply_to: emailDe(desde),
      subject: asunto || "(sin asunto)",
      html: aHtml(cuerpo, original),
      text: aTextoCitado(cuerpo, original),
      headers,
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`Resend rechazó el envío (${respuesta.status}): ${await respuesta.text()}`);
  }
  const { id: resend_id } = (await respuesta.json()) as { id?: string };

  const hilo =
    original?.hilo_id ??
    (await buscarHilo({ ids: [], asunto, contacto: destinatarios[0].toLowerCase() })) ??
    id;

  const { error } = await admin.from("correos").insert({
    id,
    hilo_id: hilo,
    direccion: "saliente",
    de_email: emailDe(desde),
    de_nombre: desde.includes("<") ? desde.split("<")[0].trim().replace(/^"|"$/g, "") : null,
    para: destinatarios,
    cc: copias,
    asunto: asunto || "(sin asunto)",
    texto: cuerpo,
    html: aHtml(cuerpo),
    message_id,
    en_respuesta_a: original?.message_id ?? null,
    referencias,
    leido: true,
    resend_id: resend_id ?? null,
    enviado_por: usuarioId && usuarioId !== "demo" ? usuarioId : null,
  });
  if (error) console.error("enviarDesdeBuzon (guardar):", error.message);
  return hilo;
}
