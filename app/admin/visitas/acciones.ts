"use server";

import { revalidatePath } from "next/cache";
import { bloqueoDemo, requerirAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-servidor";

const ESTADOS = ["nueva", "en_contacto", "confirmada", "cerrada"];

/** Estado y notas internas de una solicitud de visita. */
export async function actualizarVisita(formulario: FormData) {
  if (bloqueoDemo()) return;
  try {
    await requerirAdmin();
  } catch {
    return;
  }
  const estado = String(formulario.get("estado") ?? "");
  if (!ESTADOS.includes(estado)) return;
  await supabaseAdmin()
    .from("solicitudes_visita")
    .update({ estado, notas: String(formulario.get("notas") ?? "").trim() || null })
    .eq("id", String(formulario.get("visita_id") ?? ""));
  revalidatePath("/admin/visitas");
}
