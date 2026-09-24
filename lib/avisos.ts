import "server-only";
import { traducir } from "./i18n/contenido";
import { crearFormato } from "./formato";
import { esIdioma, fmt, type Idioma } from "./i18n/idiomas";
import { TEXTOS } from "./i18n/textos";
import { supabaseAdmin } from "./supabase-servidor";

/**
 * Avisos por correo del circuito de cotizaciones y pedidos.
 *
 *  Al cliente (en su idioma): solicitud recibida, cotización lista, pedido
 *  confirmado y pedido enviado.
 *  A los administradores (en español): nueva solicitud, cotización aceptada
 *  o rechazada.
 *
 * Salen por Resend desde CORREO_BUZON (o CORREO_REMITENTE). Si el correo
 * falla se registra y se sigue: un aviso caído no puede frenar un pedido.
 */

export const SITIO = (process.env.NEXT_PUBLIC_SITIO_URL || "https://tropicalbutterflies.lat").replace(/\/$/, "");

function remitente() {
  return process.env.CORREO_BUZON || process.env.CORREO_REMITENTE || "";
}

async function enviar({ para, asunto, html, texto }: { para: string[]; asunto: string; html: string; texto: string }) {
  const desde = remitente();
  if (!process.env.RESEND_API_KEY || !desde || !para.length) {
    console.warn("avisos: correo sin configurar, no se envió:", asunto);
    return;
  }
  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: desde,
        to: para,
        reply_to: desde.match(/<([^>]+)>/)?.[1] ?? desde,
        subject: asunto,
        html,
        text: texto,
      }),
    });
    if (!respuesta.ok) console.error("avisos:", respuesta.status, await respuesta.text());
  } catch (error) {
    console.error("avisos:", error instanceof Error ? error.message : error);
  }
}

const escapar = (t: string) =>
  t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Marco común: marca arriba, contenido, botón y pie. */
function plantilla({ titulo, parrafos, tabla = "", boton }: { titulo: string; parrafos: string[]; tabla?: string; boton?: { texto: string; url: string } }) {
  return `<div style="margin:0 auto;max-width:560px;padding:32px 24px;font-family:Helvetica,Arial,sans-serif;color:#1d1d1b;">
  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;">Tropical Butterfly Exports</p>
  <h1 style="margin:28px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;">${escapar(titulo)}</h1>
  ${parrafos.map((p) => `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#44494d;">${escapar(p)}</p>`).join("")}
  ${tabla}
  ${boton ? `<p style="margin:28px 0 0;"><a href="${boton.url}" style="display:inline-block;background:#111418;color:#fff;text-decoration:none;padding:12px 22px;font-size:14px;">${escapar(boton.texto)}</a></p>` : ""}
  <p style="margin:32px 0 0;border-top:1px solid #e3dfd6;padding-top:14px;font-size:12px;color:#8a8f93;">Tropical Butterfly Exports · Costa Rica · ${SITIO.replace(/^https?:\/\//, "")}</p>
</div>`;
}

// ─── Datos del pedido para los correos ───────────────────────────────────────

type DatosPedido = {
  id: string;
  codigo: string;
  estado: string;
  total: number;
  flete: number;
  moneda: string;
  valida_hasta: string | null;
  destino_pais: string | null;
  fecha_deseada: string | null;
  mensaje_cliente: string | null;
  idioma: Idioma;
  cliente: { email: string; nombre: string; empresa: string | null };
  items: { nombre: string; cientifico: string; cantidad: number; precio: number }[];
};

async function datosPedido(id: string): Promise<DatosPedido | null> {
  const admin = supabaseAdmin();
  const { data: p } = await admin
    .from("pedidos")
    .select(
      "id, codigo, estado, total, flete, moneda, valida_hasta, destino_pais, fecha_deseada, mensaje_cliente, idioma, cliente_id, items:pedido_items ( cantidad, precio_unitario, especie:especies ( nombre_comun, nombre_cientifico, traducciones ) )",
    )
    .eq("id", id)
    .maybeSingle();
  if (!p) return null;

  const idioma: Idioma = esIdioma(p.idioma) ? p.idioma : "en";
  const [{ data: usuario }, { data: perfil }] = await Promise.all([
    admin.auth.admin.getUserById(p.cliente_id),
    admin.from("perfiles").select("nombre, empresa").eq("id", p.cliente_id).maybeSingle(),
  ]);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const items = ((p.items ?? []) as any[]).map((i) => {
    const especie = traducir(Array.isArray(i.especie) ? i.especie[0] : i.especie, idioma, ["nombre_comun"]);
    return {
      nombre: especie?.nombre_comun ?? "—",
      cientifico: especie?.nombre_cientifico ?? "",
      cantidad: i.cantidad,
      precio: Number(i.precio_unitario),
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return {
    ...p,
    total: Number(p.total),
    flete: Number(p.flete ?? 0),
    idioma,
    items,
    cliente: {
      email: usuario.user?.email ?? "",
      nombre: (perfil?.nombre as string) || (usuario.user?.email ?? "").split("@")[0],
      empresa: (perfil?.empresa as string) ?? null,
    },
  };
}

function tablaItems(d: DatosPedido, idioma: Idioma, conPrecios: boolean) {
  const t = TEXTOS[idioma].correos;
  const f = crearFormato(idioma);
  const celda = "padding:8px 6px;border-bottom:1px solid #e3dfd6;font-size:13px;";
  const filas = d.items
    .map(
      (i) => `<tr><td style="${celda}">${escapar(i.nombre)}<br><span style="color:#8a8f93;font-style:italic;">${escapar(i.cientifico)}</span></td>
      <td style="${celda}text-align:right;">${f.numero(i.cantidad)}</td>
      ${conPrecios ? `<td style="${celda}text-align:right;">${f.moneda(i.cantidad * i.precio, d.moneda)}</td>` : ""}</tr>`,
    )
    .join("");
  const extra = conPrecios
    ? `${d.flete ? `<tr><td style="${celda}" colspan="2">${escapar(t.flete)}</td><td style="${celda}text-align:right;">${f.moneda(d.flete, d.moneda)}</td></tr>` : ""}
       <tr><td style="padding:10px 6px;font-size:14px;font-weight:bold;" colspan="2">${escapar(t.total)}</td><td style="padding:10px 6px;font-size:14px;font-weight:bold;text-align:right;">${f.moneda(d.total, d.moneda)}</td></tr>`
    : "";
  return `<table style="margin:22px 0 0;width:100%;border-collapse:collapse;">
    <tr><th style="${celda}text-align:left;color:#8a8f93;font-weight:normal;">${escapar(t.especie)}</th><th style="${celda}text-align:right;color:#8a8f93;font-weight:normal;">${escapar(t.cantidad)}</th>${conPrecios ? `<th style="${celda}"></th>` : ""}</tr>
    ${filas}${extra}</table>`;
}

// ─── Al cliente ──────────────────────────────────────────────────────────────

export type AvisoCliente = "recibida" | "cotizacion" | "confirmado" | "enviado";

export async function avisarCliente(pedidoId: string, tipo: AvisoCliente) {
  const d = await datosPedido(pedidoId);
  if (!d?.cliente.email) return;
  const t = TEXTOS[d.idioma].correos;
  const f = crearFormato(d.idioma);

  const textos = {
    recibida: { asunto: t.recibidaAsunto, titulo: t.recibidaTitulo, texto: t.recibidaTexto, ruta: `/panel/cotizaciones/${d.id}`, precios: false },
    cotizacion: { asunto: t.cotizacionAsunto, titulo: t.cotizacionTitulo, texto: t.cotizacionTexto, ruta: `/panel/cotizaciones/${d.id}`, precios: true },
    confirmado: { asunto: t.confirmadoAsunto, titulo: t.confirmadoTitulo, texto: t.confirmadoTexto, ruta: "/panel/pedidos", precios: true },
    enviado: { asunto: t.enviadoAsunto, titulo: t.enviadoTitulo, texto: t.enviadoTexto, ruta: "/panel/envios", precios: false },
  }[tipo];

  const parrafos = [textos.texto];
  if (tipo === "cotizacion" && d.valida_hasta) parrafos.push(fmt(t.validaHasta, { fecha: f.fecha(d.valida_hasta) }));

  await enviar({
    para: [d.cliente.email],
    asunto: fmt(textos.asunto, { codigo: d.codigo }),
    html: plantilla({
      titulo: textos.titulo,
      parrafos,
      tabla: tablaItems(d, d.idioma, textos.precios),
      boton: { texto: t.verEnPanel, url: `${SITIO}${textos.ruta}` },
    }),
    texto: `${textos.titulo}\n\n${parrafos.join("\n")}\n\n${d.items.map((i) => `- ${i.nombre}: ${i.cantidad}`).join("\n")}\n\n${SITIO}${textos.ruta}`,
  });
}

// ─── A los administradores ───────────────────────────────────────────────────

async function correosAdmins() {
  const { data } = await supabaseAdmin().rpc("clientes_admin");
  return ((data ?? []) as { email: string; rol: string }[]).filter((c) => c.rol === "admin").map((c) => c.email);
}

export type AvisoAdmin = "solicitud" | "aceptada" | "rechazada";

export async function avisarAdmins(pedidoId: string, tipo: AvisoAdmin) {
  const [d, para] = await Promise.all([datosPedido(pedidoId), correosAdmins()]);
  if (!d || !para.length) return;
  const f = crearFormato("es");
  const quien = d.cliente.empresa ? `${d.cliente.nombre} (${d.cliente.empresa})` : d.cliente.nombre;

  const textos = {
    solicitud: {
      asunto: `Nueva solicitud de cotización ${d.codigo} — ${quien}`,
      titulo: "Nueva solicitud de cotización",
      parrafos: [
        `${quien} · ${d.cliente.email}`,
        [d.destino_pais && `Destino: ${d.destino_pais}`, d.fecha_deseada && `Fecha deseada: ${f.fecha(d.fecha_deseada)}`].filter(Boolean).join(" · "),
        d.mensaje_cliente ? `Comentarios: ${d.mensaje_cliente}` : "",
        "Poné los precios y enviale la cotización desde el panel.",
      ].filter(Boolean),
      precios: false,
    },
    aceptada: {
      asunto: `Cotización ${d.codigo} aceptada — ${quien}`,
      titulo: "El cliente aceptó la cotización",
      parrafos: [`${quien} · ${d.cliente.email}`, "Revisá el pedido y confirmalo para que le llegue la confirmación al cliente."],
      precios: true,
    },
    rechazada: {
      asunto: `Cotización ${d.codigo} rechazada — ${quien}`,
      titulo: "El cliente rechazó la cotización",
      parrafos: [`${quien} · ${d.cliente.email}`, "Podés escribirle desde el panel de correo si querés ajustar la propuesta."],
      precios: true,
    },
  }[tipo];

  await enviar({
    para,
    asunto: textos.asunto,
    html: plantilla({
      titulo: textos.titulo,
      parrafos: textos.parrafos,
      tabla: tablaItems(d, "es", textos.precios),
      boton: { texto: "Abrir en el panel", url: `${SITIO}/admin/pedidos/${d.id}` },
    }),
    texto: `${textos.titulo}\n\n${textos.parrafos.join("\n")}\n\n${SITIO}/admin/pedidos/${d.id}`,
  });
}

// ─── Solicitudes de visita ───────────────────────────────────────────────────

/** Etiquetas en español de los intereses del formulario de /visitas. */
export const INTERESES_VISITA = {
  instalaciones: "Nuestras instalaciones",
  criaderos: "Los criaderos",
  hospedaje: "Hospedaje",
  tour: "Tour por Costa Rica",
  negocios: "Día de negocios",
  capacitacion: "Capacitación",
  arbol: "Sembrar su árbol",
} as const;
export type InteresVisita = keyof typeof INTERESES_VISITA;

export async function avisarVisita(v: {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
  pais: string;
  fechas: string | null;
  personas: number | null;
  intereses: string[];
  mensaje: string | null;
}) {
  const para = await correosAdmins();
  if (!para.length) return;
  const quien = v.empresa ? `${v.nombre} (${v.empresa})` : v.nombre;
  const parrafos = [
    `${quien} · ${v.email} · ${v.pais}`,
    [v.fechas && `Fechas: ${v.fechas}`, v.personas && `Personas: ${v.personas}`].filter(Boolean).join(" · "),
    v.intereses.length
      ? `Le interesa: ${v.intereses.map((i) => INTERESES_VISITA[i as InteresVisita] ?? i).join(", ")}`
      : "",
    v.mensaje ? `Mensaje: ${v.mensaje}` : "",
  ].filter(Boolean);
  await enviar({
    para,
    asunto: `Solicitud de visita — ${quien}`,
    html: plantilla({
      titulo: "Nueva solicitud de visita",
      parrafos,
      boton: { texto: "Abrir en el panel", url: `${SITIO}/admin/visitas` },
    }),
    texto: `Nueva solicitud de visita\n\n${parrafos.join("\n")}\n\n${SITIO}/admin/visitas`,
  });
}
