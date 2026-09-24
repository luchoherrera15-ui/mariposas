"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { avisarAdmins } from "@/lib/avisos";
import { modoDemo } from "@/lib/config";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase-servidor";

/**
 * El cliente acepta o rechaza una cotización. Solo la suya, solo si está en
 * estado "cotizado" y no venció. Aceptada pasa a "pendiente" (por confirmar).
 */
export async function responderCotizacion(formulario: FormData) {
  if (modoDemo) return;
  const id = String(formulario.get("pedido_id") ?? "");
  const acepta = formulario.get("decision") === "aceptar";

  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect("/entrar");

  const admin = supabaseAdmin();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("id, cliente_id, estado, valida_hasta")
    .eq("id", id)
    .maybeSingle();
  if (!pedido || pedido.cliente_id !== sesion.user.id || pedido.estado !== "cotizado") return;
  const hoy = new Date().toISOString().slice(0, 10);
  if (acepta && pedido.valida_hasta && pedido.valida_hasta < hoy) return;

  await admin
    .from("pedidos")
    .update({ estado: acepta ? "pendiente" : "rechazado", respondido_en: new Date().toISOString() })
    .eq("id", id)
    .eq("estado", "cotizado");

  await avisarAdmins(id, acepta ? "aceptada" : "rechazada");
  revalidatePath("/panel", "layout");
  revalidatePath("/admin/pedidos");
}
