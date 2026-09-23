import "server-only";
import { modoDemo } from "./config";
import type { Idioma } from "./i18n/idiomas";
import {
  especiesDemo,
  pedidosDemo,
  proyectosDemo,
  registrosDemo,
  totalMariposasDemo,
} from "./demo";
import { traducir } from "./i18n/contenido";
import { obtenerIdioma } from "./i18n/servidor";
import { supabaseAdmin, supabaseServidor } from "./supabase-servidor";
import type {
  Envio,
  Especie,
  Pedido,
  ProyectoImpacto,
  RegistroImpacto,
  ResumenCliente,
} from "./tipos";

/** PostgREST devuelve objeto o arreglo según detecte la relación. Normaliza. */
function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

export type UsuarioActual = {
  id: string;
  email: string;
  nombre: string;
  /** Sin aprobar ve su panel, pero no pedidos, envíos ni precios. */
  aprobado: boolean;
} | null;

export async function obtenerUsuario(): Promise<UsuarioActual> {
  if (modoDemo) {
    return { id: "demo", email: "cliente@demo.cr", nombre: "Cliente de demostración", aprobado: true };
  }
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, aprobado")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    nombre: perfil?.nombre || (data.user.email ?? "").split("@")[0],
    aprobado: perfil?.aprobado === true,
  };
}

// ─── Catálogo ────────────────────────────────────────────────────────────────

export async function obtenerEspecies(): Promise<Especie[]> {
  if (modoDemo) return especiesDemo;
  const idioma = await obtenerIdioma();
  // Los precios no son públicos (la API anónima ya no los expone), pero el
  // catálogo sigue ordenado de la más cara a la más barata: por eso se
  // consulta con service_role, y el precio no sale de esta función.
  const { data, error } = await supabaseAdmin()
    .from("especies")
    .select("id, nombre_comun, nombre_cientifico, familia, region, descripcion, emoji, traducciones")
    .eq("activo", true)
    .order("precio_unitario", { ascending: false });
  if (error) {
    console.error("obtenerEspecies:", error.message);
    return especiesDemo;
  }
  return data.map((fila) => {
    const { traducciones, ...especie } = traducir(fila, idioma, ["nombre_comun", "region", "descripcion"]);
    void traducciones;
    return especie;
  }) as Especie[];
}

export async function obtenerTotalMariposasVendidas(): Promise<number> {
  if (modoDemo) return totalMariposasDemo;
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("total_mariposas_vendidas");
  if (error) {
    console.error("total_mariposas_vendidas:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

// ─── Impacto social ──────────────────────────────────────────────────────────

export async function obtenerImpacto(): Promise<ProyectoImpacto[]> {
  if (modoDemo) return proyectosDemo;
  const idioma = await obtenerIdioma();
  const supabase = await supabaseServidor();
  const [{ data: proyectos, error }, { data: reglas }] = await Promise.all([
    supabase.from("vista_impacto_global").select("*").order("orden"),
    supabase.from("reglas_impacto").select("proyecto_id, mariposas_por_bloque, unidades_por_bloque").eq("activo", true),
  ]);
  if (error || !proyectos) {
    console.error("obtenerImpacto:", error?.message);
    return proyectosDemo;
  }
  const porProyecto = new Map(
    (reglas ?? []).map((r) => [
      r.proyecto_id as string,
      { mariposas_por_bloque: r.mariposas_por_bloque as number, unidades_por_bloque: Number(r.unidades_por_bloque) },
    ]),
  );
  return proyectos.map((fila) => {
    const p = traducir(fila, idioma, ["nombre", "descripcion", "unidad", "unidad_singular"]);
    return {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      descripcion: p.descripcion,
      unidad: p.unidad,
      unidad_singular: p.unidad_singular ?? p.unidad,
      emoji: p.emoji,
      meta_anual: p.meta_anual === null ? null : Number(p.meta_anual),
      orden: p.orden,
      ejecutado: Number(p.ejecutado ?? 0),
      regla: porProyecto.get(p.id) ?? null,
    };
  });
}

export async function obtenerRegistrosImpacto(): Promise<RegistroImpacto[]> {
  if (modoDemo) return registrosDemo;
  const idioma = await obtenerIdioma();
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("impacto_registros")
    .select("id, cantidad, fecha, detalle, traducciones, proyecto:proyectos_sociales ( nombre, unidad, traducciones )")
    .order("fecha", { ascending: false })
    .limit(20);
  if (error || !data) {
    console.error("obtenerRegistrosImpacto:", error?.message);
    return registrosDemo;
  }
  return data.map((fila) => {
    const r = traducir(fila, idioma, ["detalle"]);
    const crudo = uno(r.proyecto as unknown as { nombre: string; unidad: string; traducciones: unknown } | null);
    const proyecto = crudo ? traducir(crudo, idioma, ["nombre", "unidad"]) : null;
    return {
      id: r.id,
      proyecto: proyecto?.nombre ?? "—",
      unidad: proyecto?.unidad ?? "",
      cantidad: Number(r.cantidad),
      fecha: r.fecha,
      detalle: r.detalle,
    };
  });
}

// ─── Panel del cliente ───────────────────────────────────────────────────────

const SELECT_PEDIDO = `
  id, codigo, estado, total, moneda, notas, creado_en,
  items:pedido_items (
    id, cantidad, precio_unitario,
    especie:especies ( nombre_comun, nombre_cientifico, emoji, traducciones )
  ),
  envio:envios (
    id, transportista, numero_guia, url_rastreo, estado, origen, destino,
    enviado_en, entrega_estimada, entregado_en, temperatura_c,
    eventos:envio_eventos ( id, ocurrido_en, estado, ubicacion, descripcion )
  )
`;

export async function obtenerPedidos(): Promise<Pedido[]> {
  if (modoDemo) return pedidosDemo;
  const idioma = await obtenerIdioma();
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("pedidos")
    .select(SELECT_PEDIDO)
    .order("creado_en", { ascending: false });
  if (error || !data) {
    console.error("obtenerPedidos:", error?.message);
    return [];
  }
  return data.map((fila) => normalizarPedido(fila, idioma));
}

export async function obtenerPedido(id: string): Promise<Pedido | null> {
  if (modoDemo) return pedidosDemo.find((p) => p.id === id) ?? null;
  const idioma = await obtenerIdioma();
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("pedidos").select(SELECT_PEDIDO).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizarPedido(data, idioma);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizarPedido(fila: any, idioma: Idioma): Pedido {
  const envio = uno<any>(fila.envio);
  return {
    id: fila.id,
    codigo: fila.codigo,
    estado: fila.estado,
    total: Number(fila.total),
    moneda: fila.moneda,
    notas: fila.notas,
    creado_en: fila.creado_en,
    items: (fila.items ?? []).map((i: any) => ({
      id: i.id,
      cantidad: i.cantidad,
      precio_unitario: Number(i.precio_unitario),
      especie: especieTraducida(uno(i.especie), idioma),
    })),
    envio: envio
      ? ({
          ...envio,
          temperatura_c: envio.temperatura_c === null ? null : Number(envio.temperatura_c),
          eventos: [...(envio.eventos ?? [])].sort(
            (a: any, b: any) => new Date(b.ocurrido_en).getTime() - new Date(a.ocurrido_en).getTime(),
          ),
        } as Envio)
      : null,
  };
}

function especieTraducida(especie: any, idioma: Idioma) {
  if (!especie) return null;
  const { traducciones, ...resto } = traducir(especie, idioma, ["nombre_comun"]);
  void traducciones;
  return resto;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function calcularResumen(pedidos: Pedido[]): ResumenCliente {
  const vivos = pedidos.filter((p) => p.estado !== "cancelado");
  return {
    mariposas: vivos.reduce((t, p) => t + p.items.reduce((s, i) => s + i.cantidad, 0), 0),
    pedidos: vivos.length,
    enTransito: vivos.filter((p) => p.envio && !["entregado"].includes(p.envio.estado)).length,
    invertido: vivos.reduce((t, p) => t + p.total, 0),
    moneda: vivos[0]?.moneda ?? "USD",
  };
}

/** Mariposas por especie, ordenadas de mayor a menor (para el panel). */
export function mariposasPorEspecie(pedidos: Pedido[], sinEspecie = "—") {
  const mapa = new Map<string, { nombre: string; emoji: string | null; cantidad: number }>();
  for (const pedido of pedidos) {
    if (pedido.estado === "cancelado") continue;
    for (const item of pedido.items) {
      const nombre = item.especie?.nombre_comun ?? sinEspecie;
      const previo = mapa.get(nombre);
      mapa.set(nombre, {
        nombre,
        emoji: item.especie?.emoji ?? null,
        cantidad: (previo?.cantidad ?? 0) + item.cantidad,
      });
    }
  }
  return [...mapa.values()].sort((a, b) => b.cantidad - a.cantidad);
}
