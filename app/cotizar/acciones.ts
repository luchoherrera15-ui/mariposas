"use server";

import { revalidatePath } from "next/cache";
import { avisarAdmins, avisarCliente } from "@/lib/avisos";
import { modoDemo } from "@/lib/config";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase-servidor";

export type EstadoSolicitud = { error?: string; id?: string } | null;

const MINIMO_POR_ESPECIE = 25;
const MAXIMO_LINEAS = 60;

type Linea = { slug: string; cantidad: number };

function leer(f: FormData, k: string) {
  return String(f.get(k) ?? "").trim();
}

function leerLineas(f: FormData): Linea[] {
  try {
    const datos = JSON.parse(leer(f, "lineas") || "[]");
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((l) => l && typeof l.slug === "string")
      .slice(0, MAXIMO_LINEAS)
      .map((l) => ({ slug: l.slug, cantidad: Math.round(Number(l.cantidad) || 0) }));
  } catch {
    return [];
  }
}

/**
 * Crea la solicitud (pedido en estado "solicitado", sin precios) a nombre del
 * usuario con sesión, avisa al cliente y a los administradores.
 */
async function crearSolicitud(usuario: { id: string; email?: string }, f: FormData): Promise<EstadoSolicitud> {
  const t = (await obtenerTextos()).cotizar.errores;
  const lineas = leerLineas(f);
  const empresa = leer(f, "empresa");
  const pais = leer(f, "pais");
  const fecha = leer(f, "fecha");
  const mensaje = leer(f, "mensaje").slice(0, 2000);

  if (!lineas.length) return { error: t.vacia };
  if (lineas.some((l) => l.cantidad < MINIMO_POR_ESPECIE)) return { error: fmt(t.minimo, { n: MINIMO_POR_ESPECIE }) };
  if (!empresa) return { error: t.empresa };
  if (!pais) return { error: t.pais };

  const admin = supabaseAdmin();
  // Solo especies activas del catálogo; lo que no exista se ignora.
  const { data: especies } = await admin
    .from("especies")
    .select("id, slug")
    .eq("activo", true)
    .in("slug", lineas.map((l) => l.slug));
  const idPorSlug = new Map((especies ?? []).map((e) => [e.slug as string, e.id as string]));
  const validas = lineas.filter((l) => idPorSlug.has(l.slug));
  if (!validas.length) return { error: t.vacia };

  const idioma = await obtenerIdioma();
  const { data: pedido, error } = await admin
    .from("pedidos")
    .insert({
      cliente_id: usuario.id,
      estado: "solicitado",
      moneda: "USD",
      total: 0,
      destino_pais: pais.slice(0, 120),
      fecha_deseada: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
      mensaje_cliente: mensaje || null,
      idioma,
    })
    .select("id")
    .single();
  if (error || !pedido) {
    console.error("crearSolicitud:", error?.message);
    return { error: t.generico };
  }

  const { error: errorItems } = await admin.from("pedido_items").insert(
    validas.map((l) => ({ pedido_id: pedido.id, especie_id: idPorSlug.get(l.slug), cantidad: l.cantidad, precio_unitario: 0 })),
  );
  if (errorItems) {
    console.error("crearSolicitud (items):", errorItems.message);
    await admin.from("pedidos").delete().eq("id", pedido.id);
    return { error: t.generico };
  }

  // Perfil: se crea si falta (cuenta de otra app del proyecto) y se completa.
  await admin
    .from("perfiles")
    .upsert({ id: usuario.id, nombre: (usuario.email ?? "").split("@")[0] }, { onConflict: "id", ignoreDuplicates: true });
  await admin.from("perfiles").update({ empresa: empresa.slice(0, 160), pais: pais.slice(0, 120), idioma }).eq("id", usuario.id);

  await Promise.all([avisarCliente(pedido.id, "recibida"), avisarAdmins(pedido.id, "solicitud")]);
  revalidatePath("/panel", "layout");
  revalidatePath("/admin/pedidos");
  return { id: pedido.id };
}

/** Con sesión iniciada: se envía directo. */
export async function enviarSolicitud(_previo: EstadoSolicitud, f: FormData): Promise<EstadoSolicitud> {
  if (modoDemo) return { error: "Modo demostración." };
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: (await obtenerTextos()).cotizar.errores.generico };
  return crearSolicitud(data.user, f);
}

/**
 * Sin sesión: el formulario ya pidió el código con `enviarCodigo` (el mismo
 * del ingreso, que crea la cuenta si el correo es nuevo). Acá se verifica,
 * queda la sesión iniciada y se crea la solicitud en esa cuenta.
 */
export async function verificarYEnviar(_previo: EstadoSolicitud, f: FormData): Promise<EstadoSolicitud> {
  if (modoDemo) return { error: "Modo demostración." };
  const t = await obtenerTextos();
  const email = leer(f, "email").toLowerCase();
  const codigo = leer(f, "codigo").replace(/\D/g, "");
  if (!codigo) return { error: t.entrar.errores.faltaCodigo };

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error || !data.user) return { error: t.entrar.errores.codigoInvalido };
  return crearSolicitud(data.user, f);
}
