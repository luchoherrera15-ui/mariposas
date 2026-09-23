import "server-only";
import { modoDemo } from "./config";
import { pedidosDemo, proyectosDemo } from "./demo";
import { supabaseAdmin, supabaseServidor } from "./supabase-servidor";
import type { Pedido } from "./tipos";

/**
 * Acceso al panel administrativo. Todas las lecturas y escrituras de /admin
 * usan la llave service_role, que salta RLS: por eso cada entrada tiene que
 * pasar antes por `requerirAdmin()`.
 */

export type AdminActual = { id: string; email: string; nombre: string } | null;

/** Devuelve el usuario si es administrador; null si no lo es o no hay sesión. */
export async function usuarioAdmin(): Promise<AdminActual> {
  if (modoDemo) {
    return { id: "demo", email: "admin@demo.cr", nombre: "Administración (demo)" };
  }

  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  // El rol se lee con service_role para que no dependa de las políticas RLS.
  const { data: perfil } = await supabaseAdmin()
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", data.user.id)
    .maybeSingle();

  if (perfil?.rol !== "admin") return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    nombre: perfil?.nombre || (data.user.email ?? "").split("@")[0],
  };
}

/** Lanza si quien llama no es administrador. Usar al inicio de cada acción. */
export async function requerirAdmin() {
  const admin = await usuarioAdmin();
  if (!admin) throw new Error("Necesitás una cuenta de administrador para hacer esto.");
  return admin;
}

/** En modo demostración no hay a dónde escribir: se avisa en vez de fallar. */
export function bloqueoDemo() {
  return modoDemo
    ? { error: "Modo demostración: configurá Supabase en .env.local para poder guardar." }
    : null;
}

// ─── Lecturas ────────────────────────────────────────────────────────────────

const SELECT_PEDIDO = `
  id, codigo, cliente_id, estado, total, moneda, notas, creado_en,
  items:pedido_items (
    id, cantidad, precio_unitario,
    especie:especies ( id, nombre_comun, nombre_cientifico )
  ),
  envio:envios (
    id, transportista, numero_guia, url_rastreo, estado, origen, destino,
    enviado_en, entrega_estimada, entregado_en, temperatura_c,
    eventos:envio_eventos ( id, ocurrido_en, estado, ubicacion, descripcion )
  )
`;

export type PedidoAdmin = Pedido & { cliente_id: string; cliente?: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizar(fila: any): PedidoAdmin {
  const envio = Array.isArray(fila.envio) ? fila.envio[0] : fila.envio;
  return {
    id: fila.id,
    codigo: fila.codigo,
    cliente_id: fila.cliente_id,
    estado: fila.estado,
    total: Number(fila.total),
    moneda: fila.moneda,
    notas: fila.notas,
    creado_en: fila.creado_en,
    items: (fila.items ?? []).map((i: any) => ({
      id: i.id,
      cantidad: i.cantidad,
      precio_unitario: Number(i.precio_unitario),
      especie: Array.isArray(i.especie) ? i.especie[0] : i.especie,
    })),
    envio: envio
      ? {
          ...envio,
          temperatura_c: envio.temperatura_c === null ? null : Number(envio.temperatura_c),
          eventos: [...(envio.eventos ?? [])].sort(
            (a: any, b: any) => new Date(b.ocurrido_en).getTime() - new Date(a.ocurrido_en).getTime(),
          ),
        }
      : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type Cliente = {
  id: string;
  email: string;
  nombre: string;
  empresa: string | null;
  rol: string;
  creado_en: string;
};

export async function listarClientes(): Promise<Cliente[]> {
  if (modoDemo) {
    return [
      {
        id: "demo",
        email: "cliente@demo.cr",
        nombre: "Cliente de demostración",
        empresa: "Mariposario de ejemplo",
        rol: "cliente",
        creado_en: new Date(Date.now() - 90 * 86_400_000).toISOString(),
      },
    ];
  }

  const admin = supabaseAdmin();
  const { data: usuarios } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: perfiles } = await admin.from("perfiles").select("id, nombre, empresa, rol");
  const porId = new Map((perfiles ?? []).map((p) => [p.id as string, p]));

  return (usuarios?.users ?? []).map((u) => {
    const p = porId.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      nombre: (p?.nombre as string) || (u.email ?? "").split("@")[0],
      empresa: (p?.empresa as string) ?? null,
      rol: (p?.rol as string) ?? "cliente",
      creado_en: u.created_at,
    };
  });
}

export async function listarPedidos(estado?: string): Promise<PedidoAdmin[]> {
  if (modoDemo) {
    const todos = pedidosDemo.map((p) => ({ ...p, cliente_id: "demo" }) as PedidoAdmin);
    return estado ? todos.filter((p) => p.estado === estado) : todos;
  }
  let consulta = supabaseAdmin().from("pedidos").select(SELECT_PEDIDO).order("creado_en", { ascending: false });
  if (estado) consulta = consulta.eq("estado", estado);
  const { data, error } = await consulta;
  if (error || !data) {
    console.error("listarPedidos:", error?.message);
    return [];
  }
  return data.map(normalizar);
}

export async function obtenerPedidoAdmin(id: string): Promise<PedidoAdmin | null> {
  if (modoDemo) {
    const p = pedidosDemo.find((x) => x.id === id);
    return p ? ({ ...p, cliente_id: "demo" } as PedidoAdmin) : null;
  }
  const { data, error } = await supabaseAdmin().from("pedidos").select(SELECT_PEDIDO).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizar(data);
}

export type EspecieAdmin = {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string | null;
  region: string | null;
  precio_unitario: number;
  descripcion: string | null;
  activo: boolean;
};

export async function listarEspecies(): Promise<EspecieAdmin[]> {
  if (modoDemo) {
    const { especiesDemo } = await import("./demo");
    return especiesDemo.map((e) => ({ ...e, activo: true }));
  }
  const { data } = await supabaseAdmin()
    .from("especies")
    .select("id, nombre_comun, nombre_cientifico, familia, region, precio_unitario, descripcion, activo")
    .order("nombre_comun");
  return (data ?? []).map((e) => ({ ...e, precio_unitario: Number(e.precio_unitario) })) as EspecieAdmin[];
}

export async function listarProyectos() {
  if (modoDemo) return proyectosDemo;
  const admin = supabaseAdmin();
  const [{ data: proyectos }, { data: reglas }, { data: registros }] = await Promise.all([
    admin.from("proyectos_sociales").select("*").order("orden"),
    admin.from("reglas_impacto").select("proyecto_id, mariposas_por_bloque, unidades_por_bloque").eq("activo", true),
    admin.from("impacto_registros").select("proyecto_id, cantidad"),
  ]);
  const porProyecto = new Map(
    (reglas ?? []).map((r) => [
      r.proyecto_id as string,
      { mariposas_por_bloque: r.mariposas_por_bloque as number, unidades_por_bloque: Number(r.unidades_por_bloque) },
    ]),
  );
  const ejecutado = new Map<string, number>();
  for (const r of registros ?? []) {
    ejecutado.set(r.proyecto_id as string, (ejecutado.get(r.proyecto_id as string) ?? 0) + Number(r.cantidad));
  }
  return (proyectos ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    nombre: p.nombre as string,
    descripcion: p.descripcion as string | null,
    unidad: p.unidad as string,
    emoji: p.emoji as string | null,
    meta_anual: p.meta_anual === null ? null : Number(p.meta_anual),
    orden: p.orden as number,
    ejecutado: ejecutado.get(p.id as string) ?? 0,
    regla: porProyecto.get(p.id as string) ?? null,
  }));
}

export async function listarRegistrosImpacto() {
  if (modoDemo) {
    const { registrosDemo } = await import("./demo");
    return registrosDemo.map((r) => ({ ...r, proyecto_id: "p1" }));
  }
  const { data } = await supabaseAdmin()
    .from("impacto_registros")
    .select("id, proyecto_id, cantidad, fecha, detalle, proyecto:proyectos_sociales ( nombre, unidad )")
    .order("fecha", { ascending: false })
    .limit(60);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => {
    const p = Array.isArray(r.proyecto) ? r.proyecto[0] : r.proyecto;
    return {
      id: r.id as string,
      proyecto_id: r.proyecto_id as string,
      proyecto: p?.nombre ?? "—",
      unidad: p?.unidad ?? "",
      cantidad: Number(r.cantidad),
      fecha: r.fecha as string,
      detalle: r.detalle as string | null,
    };
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function listarAjustes() {
  if (modoDemo) {
    const { AJUSTES_POR_DEFECTO } = await import("./ajustes");
    return Object.entries(AJUSTES_POR_DEFECTO).map(([clave, valor], i) => ({
      clave,
      valor,
      etiqueta: clave,
      ayuda: null as string | null,
      grupo: "Demostración",
      multilinea: valor.length > 60,
      orden: i,
    }));
  }
  const { data } = await supabaseAdmin()
    .from("ajustes")
    .select("clave, valor, etiqueta, ayuda, grupo, multilinea, orden")
    .order("grupo")
    .order("orden");
  return data ?? [];
}

/** Cifras del encabezado de /admin. */
export async function resumenAdmin() {
  const pedidos = await listarPedidos();
  const vivos = pedidos.filter((p) => p.estado !== "cancelado");
  return {
    pedidos: vivos.length,
    porCobrar: vivos.filter((p) => p.estado === "pendiente").length,
    enCurso: vivos.filter((p) => p.envio && p.envio.estado !== "entregado").length,
    mariposas: vivos.reduce((t, p) => t + p.items.reduce((s, i) => s + i.cantidad, 0), 0),
    facturado: vivos.reduce((t, p) => t + p.total, 0),
  };
}
