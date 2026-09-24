"use server";

import { revalidatePath } from "next/cache";
import { INTERESES_VISITA, avisarVisita } from "@/lib/avisos";
import { modoDemo } from "@/lib/config";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase-servidor";

export type EstadoVisita = { ok?: boolean; error?: string } | null;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const leer = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);

/** Guarda la solicitud de /visitas y avisa a los administradores. */
export async function solicitarVisita(_previo: EstadoVisita, f: FormData): Promise<EstadoVisita> {
  const t = (await obtenerTextos()).visitas.errores;
  // Campo trampa: invisible para personas, los bots lo llenan.
  if (leer(f, "sitio_web")) return { ok: true };
  if (modoDemo) return { ok: true };

  const nombre = leer(f, "nombre", 120);
  const email = leer(f, "email", 200).toLowerCase();
  const pais = leer(f, "pais", 120);
  if (!nombre || !email || !pais) return { error: t.faltan };
  if (!CORREO_VALIDO.test(email)) return { error: t.correo };

  const admin = supabaseAdmin();
  const { count } = await admin
    .from("solicitudes_visita")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("creado_en", new Date(Date.now() - 86_400_000).toISOString());
  if ((count ?? 0) >= 3) return { error: t.demasiadas };

  const personas = Number(leer(f, "personas", 3));
  const intereses = f
    .getAll("intereses")
    .map(String)
    .filter((i) => i in INTERESES_VISITA);

  const { data: sesion } = await (await supabaseServidor()).auth.getUser();
  const fila = {
    nombre,
    empresa: leer(f, "empresa", 160) || null,
    email,
    pais,
    fechas: leer(f, "fechas", 200) || null,
    personas: Number.isInteger(personas) && personas >= 1 && personas <= 99 ? personas : null,
    intereses,
    mensaje: leer(f, "mensaje", 2000) || null,
    idioma: await obtenerIdioma(),
    usuario_id: sesion.user?.id ?? null,
  };
  const { data, error } = await admin.from("solicitudes_visita").insert(fila).select("id").single();
  if (error || !data) {
    console.error("solicitarVisita:", error?.message);
    return { error: t.generico };
  }

  await avisarVisita({ id: data.id, ...fila });
  revalidatePath("/admin/visitas");
  return { ok: true };
}
