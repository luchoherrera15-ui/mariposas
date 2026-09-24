"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bloqueoDemo, requerirAdmin } from "@/lib/admin";
import { avisarCliente } from "@/lib/avisos";
import type { Traducciones } from "@/lib/i18n/contenido";
import { IDIOMA_BASE_CONTENIDO, NOMBRE_IDIOMA, esIdioma } from "@/lib/i18n/idiomas";
import { supabaseAdmin } from "@/lib/supabase-servidor";

/**
 * Escrituras del panel administrativo. Todo pasa por `requerirAdmin()` y por
 * la llave service_role: los clientes nunca escriben nada desde el navegador.
 */

export type Resultado = { error?: string; ok?: string } | null;

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const numero = (f: FormData, k: string) => {
  const v = texto(f, k);
  return v === "" ? null : Number(v.replace(",", "."));
};
const oNulo = (f: FormData, k: string) => texto(f, k) || null;

/** Refresca el sitio público y el panel del cliente tras cada cambio. */
function refrescar(ruta?: string) {
  revalidatePath("/", "layout");
  if (ruta) revalidatePath(ruta);
}

async function preparar(): Promise<Resultado> {
  const demo = bloqueoDemo();
  if (demo) return demo;
  try {
    await requerirAdmin();
    return null;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sin permiso." };
  }
}

/** Recalcula el total del pedido: líneas + flete. */
async function recalcularTotal(pedidoId: string) {
  const admin = supabaseAdmin();
  const [{ data }, { data: pedido }] = await Promise.all([
    admin.from("pedido_items").select("cantidad, precio_unitario").eq("pedido_id", pedidoId),
    admin.from("pedidos").select("flete").eq("id", pedidoId).maybeSingle(),
  ]);
  const lineas = (data ?? []).reduce((s, i) => s + i.cantidad * Number(i.precio_unitario), 0);
  await admin.from("pedidos").update({ total: lineas + Number(pedido?.flete ?? 0) }).eq("id", pedidoId);
}

/** Cambios de estado que se le avisan al cliente por correo. */
async function avisarCambioDeEstado(pedidoId: string, anterior: string | null, nuevo: string) {
  if (anterior === nuevo) return;
  if (nuevo === "confirmado") await avisarCliente(pedidoId, "confirmado");
  if (nuevo === "enviado") await avisarCliente(pedidoId, "enviado");
}

// ─── Cotizaciones ────────────────────────────────────────────────────────────

/**
 * Pone precio a cada línea, flete y vigencia, y le manda la cotización al
 * cliente. Enviar una cotización aprueba la cuenta del cliente: a partir de
 * ahí ve precios y pedidos en su panel.
 */
export async function enviarCotizacion(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const pedido_id = texto(formulario, "pedido_id");
  const admin = supabaseAdmin();
  const { data: pedido } = await admin.from("pedidos").select("id, cliente_id, estado").eq("id", pedido_id).maybeSingle();
  if (!pedido) return { error: "No encontré el pedido." };
  if (!["solicitado", "cotizado", "rechazado"].includes(pedido.estado)) {
    return { error: "Este pedido ya no es una cotización: editá las líneas abajo." };
  }

  const { data: items } = await admin.from("pedido_items").select("id").eq("pedido_id", pedido_id);
  for (const item of items ?? []) {
    const precio = numero(formulario, `precio_${item.id}`);
    if (precio === null || !Number.isFinite(precio) || precio <= 0) {
      return { error: "Poné un precio mayor que cero a cada especie." };
    }
    await admin.from("pedido_items").update({ precio_unitario: precio }).eq("id", item.id);
  }

  const flete = numero(formulario, "flete") ?? 0;
  const { error } = await admin
    .from("pedidos")
    .update({
      estado: "cotizado",
      flete: Number.isFinite(flete) && flete > 0 ? flete : 0,
      moneda: texto(formulario, "moneda") || "USD",
      valida_hasta: oNulo(formulario, "valida_hasta"),
      respuesta: oNulo(formulario, "respuesta"),
      cotizado_en: new Date().toISOString(),
    })
    .eq("id", pedido_id);
  if (error) return { error: `No se pudo guardar: ${error.message}` };

  await recalcularTotal(pedido_id);
  await admin
    .from("perfiles")
    .update({ aprobado: true, aprobado_en: new Date().toISOString() })
    .eq("id", pedido.cliente_id)
    .eq("aprobado", false);

  await avisarCliente(pedido_id, "cotizacion");
  refrescar(`/admin/pedidos/${pedido_id}`);
  revalidatePath("/panel", "layout");
  return { ok: "Cotización enviada. Le llegó un correo al cliente con el detalle." };
}

/** El cliente aceptó: se confirma el pedido y se le avisa. */
export async function confirmarPedido(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  const pedido_id = texto(formulario, "pedido_id");
  const { data } = await supabaseAdmin()
    .from("pedidos")
    .update({ estado: "confirmado", confirmado_en: new Date().toISOString() })
    .eq("id", pedido_id)
    .eq("estado", "pendiente")
    .select("id");
  if (data?.length) await avisarCliente(pedido_id, "confirmado");
  refrescar(`/admin/pedidos/${pedido_id}`);
  revalidatePath("/panel", "layout");
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export async function crearPedido(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const cliente_id = texto(formulario, "cliente_id");
  if (!cliente_id) return { error: "Elegí un cliente." };

  const { data, error } = await supabaseAdmin()
    .from("pedidos")
    .insert({
      cliente_id,
      estado: texto(formulario, "estado") || "pendiente",
      notas: oNulo(formulario, "notas"),
      moneda: texto(formulario, "moneda") || "USD",
    })
    .select("id")
    .single();

  if (error) return { error: `No se pudo crear el pedido: ${error.message}` };
  refrescar("/admin/pedidos");
  redirect(`/admin/pedidos/${data.id}`);
}

export async function actualizarPedido(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const id = texto(formulario, "pedido_id");
  const estado = texto(formulario, "estado");
  const { data: antes } = await supabaseAdmin().from("pedidos").select("estado").eq("id", id).maybeSingle();
  const { error } = await supabaseAdmin()
    .from("pedidos")
    .update({
      estado,
      notas: oNulo(formulario, "notas"),
      moneda: texto(formulario, "moneda") || "USD",
      ...(estado === "confirmado" && antes?.estado !== "confirmado" ? { confirmado_en: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) return { error: `No se pudo guardar: ${error.message}` };
  await avisarCambioDeEstado(id, antes?.estado ?? null, estado);
  refrescar(`/admin/pedidos/${id}`);
  revalidatePath("/panel", "layout");
  return {
    ok: ["confirmado", "enviado"].includes(estado) && antes?.estado !== estado
      ? "Pedido actualizado. Se le avisó al cliente por correo."
      : "Pedido actualizado.",
  };
}

export async function eliminarPedido(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  await supabaseAdmin().from("pedidos").delete().eq("id", texto(formulario, "pedido_id"));
  refrescar("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function agregarItem(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const pedido_id = texto(formulario, "pedido_id");
  const especie_id = texto(formulario, "especie_id");
  const cantidad = numero(formulario, "cantidad");
  const precio = numero(formulario, "precio_unitario");

  if (!especie_id) return { error: "Elegí una especie." };
  if (!cantidad || cantidad <= 0) return { error: "La cantidad tiene que ser mayor que cero." };

  const { error } = await supabaseAdmin().from("pedido_items").insert({
    pedido_id,
    especie_id,
    cantidad,
    precio_unitario: precio ?? 0,
  });
  if (error) return { error: `No se pudo agregar: ${error.message}` };

  await recalcularTotal(pedido_id);
  refrescar(`/admin/pedidos/${pedido_id}`);
  return { ok: "Línea agregada." };
}

export async function eliminarItem(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  const pedido_id = texto(formulario, "pedido_id");
  await supabaseAdmin().from("pedido_items").delete().eq("id", texto(formulario, "item_id"));
  await recalcularTotal(pedido_id);
  refrescar(`/admin/pedidos/${pedido_id}`);
}

// ─── Envíos y tracking ───────────────────────────────────────────────────────

export async function guardarEnvio(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const pedido_id = texto(formulario, "pedido_id");
  const fila = {
    pedido_id,
    transportista: oNulo(formulario, "transportista"),
    numero_guia: oNulo(formulario, "numero_guia"),
    url_rastreo: oNulo(formulario, "url_rastreo"),
    estado: texto(formulario, "estado") || "preparando",
    origen: oNulo(formulario, "origen"),
    destino: oNulo(formulario, "destino"),
    enviado_en: oNulo(formulario, "enviado_en"),
    entrega_estimada: oNulo(formulario, "entrega_estimada"),
    entregado_en: oNulo(formulario, "entregado_en"),
    temperatura_c: numero(formulario, "temperatura_c"),
  };

  // pedido_id es único en `envios`: un upsert sirve para crear y para editar.
  const { error } = await supabaseAdmin().from("envios").upsert(fila, { onConflict: "pedido_id" });
  if (error) return { error: `No se pudo guardar el envío: ${error.message}` };

  refrescar(`/admin/pedidos/${pedido_id}`);
  return { ok: "Envío guardado." };
}

export async function agregarEvento(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const envio_id = texto(formulario, "envio_id");
  const estado = texto(formulario, "estado");
  if (!envio_id) return { error: "Guardá primero los datos del envío." };
  if (!estado) return { error: "Elegí el estado del movimiento." };

  const ocurrido = texto(formulario, "ocurrido_en");
  const { error } = await supabaseAdmin().from("envio_eventos").insert({
    envio_id,
    estado,
    ubicacion: oNulo(formulario, "ubicacion"),
    descripcion: oNulo(formulario, "descripcion"),
    ocurrido_en: ocurrido ? new Date(ocurrido).toISOString() : new Date().toISOString(),
  });
  if (error) return { error: `No se pudo agregar el movimiento: ${error.message}` };

  // El estado del envío sigue al último movimiento cargado.
  await supabaseAdmin().from("envios").update({ estado }).eq("id", envio_id);

  refrescar(`/admin/pedidos/${texto(formulario, "pedido_id")}`);
  return { ok: "Movimiento agregado." };
}

export async function eliminarEvento(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  await supabaseAdmin().from("envio_eventos").delete().eq("id", texto(formulario, "evento_id"));
  refrescar(`/admin/pedidos/${texto(formulario, "pedido_id")}`);
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export async function guardarEspecie(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const id = texto(formulario, "especie_id");
  const fila = {
    nombre_comun: texto(formulario, "nombre_comun"),
    nombre_cientifico: texto(formulario, "nombre_cientifico"),
    familia: oNulo(formulario, "familia"),
    region: oNulo(formulario, "region"),
    precio_unitario: numero(formulario, "precio_unitario") ?? 0,
    descripcion: oNulo(formulario, "descripcion"),
    envergadura: oNulo(formulario, "envergadura"),
    vuelo: oNulo(formulario, "vuelo"),
    disponibilidad: oNulo(formulario, "disponibilidad"),
    destacada: formulario.get("destacada") === "on",
    activo: formulario.get("activo") === "on",
    // La página de la especie vive en /especies/<slug>.
    slug: texto(formulario, "nombre_cientifico").toLowerCase().replace(/\s+/g, "-"),
  };
  if (!fila.nombre_comun || !fila.nombre_cientifico) {
    return { error: "El nombre común y el científico son obligatorios." };
  }

  const admin = supabaseAdmin();
  const { error } = id
    ? await admin.from("especies").update(fila).eq("id", id)
    : await admin.from("especies").insert(fila);

  if (error) return { error: `No se pudo guardar: ${error.message}` };
  refrescar("/admin/especies");
  return { ok: id ? "Especie actualizada." : "Especie creada." };
}

export async function eliminarEspecie(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  // Si tiene pedidos asociados la FK lo impide: en ese caso se desactiva.
  const id = texto(formulario, "especie_id");
  const { error } = await supabaseAdmin().from("especies").delete().eq("id", id);
  if (error) await supabaseAdmin().from("especies").update({ activo: false }).eq("id", id);
  refrescar("/admin/especies");
}

// ─── Impacto social ──────────────────────────────────────────────────────────

export async function guardarProyecto(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const id = texto(formulario, "proyecto_id");
  const fila = {
    slug: texto(formulario, "slug"),
    nombre: texto(formulario, "nombre"),
    descripcion: oNulo(formulario, "descripcion"),
    unidad: texto(formulario, "unidad"),
    meta_anual: numero(formulario, "meta_anual"),
    orden: numero(formulario, "orden") ?? 0,
    activo: true,
  };
  if (!fila.nombre || !fila.unidad || !fila.slug) {
    return { error: "Nombre, unidad e identificador son obligatorios." };
  }

  const admin = supabaseAdmin();
  const { data, error } = id
    ? await admin.from("proyectos_sociales").update(fila).eq("id", id).select("id").single()
    : await admin.from("proyectos_sociales").insert(fila).select("id").single();

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  // La regla "cada N mariposas = X unidades" viaja en el mismo formulario.
  const bloque = numero(formulario, "mariposas_por_bloque");
  const unidades = numero(formulario, "unidades_por_bloque");
  if (bloque && bloque > 0 && unidades !== null) {
    await admin.from("reglas_impacto").delete().eq("proyecto_id", data.id);
    await admin.from("reglas_impacto").insert({
      proyecto_id: data.id,
      mariposas_por_bloque: bloque,
      unidades_por_bloque: unidades,
      activo: true,
    });
  }

  refrescar("/admin/impacto");
  return { ok: id ? "Proyecto actualizado." : "Proyecto creado." };
}

export async function agregarRegistroImpacto(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const proyecto_id = texto(formulario, "proyecto_id");
  const cantidad = numero(formulario, "cantidad");
  if (!proyecto_id) return { error: "Elegí un proyecto." };
  if (cantidad === null) return { error: "Escribí la cantidad ejecutada." };

  const { error } = await supabaseAdmin().from("impacto_registros").insert({
    proyecto_id,
    cantidad,
    fecha: texto(formulario, "fecha") || new Date().toISOString().slice(0, 10),
    detalle: oNulo(formulario, "detalle"),
  });
  if (error) return { error: `No se pudo agregar: ${error.message}` };

  refrescar("/admin/impacto");
  return { ok: "Registro agregado." };
}

export async function eliminarRegistroImpacto(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  await supabaseAdmin().from("impacto_registros").delete().eq("id", texto(formulario, "registro_id"));
  refrescar("/admin/impacto");
}

// ─── Ajustes del sitio ───────────────────────────────────────────────────────

export async function guardarAjustes(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const alto = await preparar();
  if (alto) return alto;

  const admin = supabaseAdmin();
  const idiomaPedido = texto(formulario, "idioma");
  const idioma = esIdioma(idiomaPedido) ? idiomaPedido : IDIOMA_BASE_CONTENIDO;
  const cambios: { clave: string; valor: string }[] = [];
  for (const [campo, valor] of formulario.entries()) {
    if (campo.startsWith("ajuste_") && typeof valor === "string") {
      cambios.push({ clave: campo.slice("ajuste_".length), valor });
    }
  }
  if (cambios.length === 0) return { error: "No hubo cambios que guardar." };

  // El español va en "valor"; los demás idiomas, en "traducciones".
  const { data: actuales } = await admin.from("ajustes").select("clave, traducciones");
  const traduccionesDe = new Map((actuales ?? []).map((f) => [f.clave as string, (f.traducciones ?? {}) as Traducciones]));

  for (const cambio of cambios) {
    let fila: Record<string, unknown>;
    if (idioma === IDIOMA_BASE_CONTENIDO) {
      fila = { valor: cambio.valor };
    } else {
      const traducciones = { ...(traduccionesDe.get(cambio.clave) ?? {}) };
      // Vacío = sin traducción: el sitio muestra el español.
      if (cambio.valor.trim() === "") delete traducciones[idioma];
      else traducciones[idioma] = { valor: cambio.valor };
      fila = { traducciones };
    }
    const { error } = await admin
      .from("ajustes")
      .update({ ...fila, actualizado_en: new Date().toISOString() })
      .eq("clave", cambio.clave);
    if (error) return { error: `No se pudo guardar "${cambio.clave}": ${error.message}` };
  }

  refrescar("/admin/ajustes");
  return { ok: `Guardado en ${NOMBRE_IDIOMA[idioma]}. Se actualizaron ${cambios.length} campos del sitio.` };
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export async function cambiarAprobacion(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  const aprobado = texto(formulario, "aprobado") === "true";
  await supabaseAdmin()
    .from("perfiles")
    .update({ aprobado, aprobado_en: aprobado ? new Date().toISOString() : null })
    .eq("id", texto(formulario, "cliente_id"));
  refrescar("/admin/clientes");
}

export async function cambiarRol(formulario: FormData) {
  const alto = await preparar();
  if (alto) return;
  const rol = texto(formulario, "rol");
  // Un administrador siempre queda con la cuenta aprobada.
  await supabaseAdmin()
    .from("perfiles")
    .update(rol === "admin" ? { rol, aprobado: true, aprobado_en: new Date().toISOString() } : { rol })
    .eq("id", texto(formulario, "cliente_id"));
  refrescar("/admin/clientes");
}
