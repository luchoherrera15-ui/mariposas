"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bloqueoDemo, requerirAdmin } from "@/lib/admin";
import { buzonConfigurado, enviarDesdeBuzon } from "@/lib/buzon";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import type { Resultado } from "../acciones";

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function enviarCorreo(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const demo = bloqueoDemo();
  if (demo) return demo;

  let admin;
  try {
    admin = await requerirAdmin();
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sin permiso." };
  }
  if (!buzonConfigurado()) {
    return { error: "Falta configurar RESEND_API_KEY y CORREO_BUZON en Vercel." };
  }

  let hilo: string;
  try {
    hilo = await enviarDesdeBuzon({
      para: texto(formulario, "para"),
      cc: texto(formulario, "cc"),
      asunto: texto(formulario, "asunto"),
      cuerpo: String(formulario.get("cuerpo") ?? ""),
      responderA: texto(formulario, "responder_a") || null,
      usuarioId: admin.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar." };
  }

  revalidatePath("/admin/correo", "layout");
  redirect(`/admin/correo/${hilo}?enviado=1`);
}

async function soloAdmin() {
  if (bloqueoDemo()) return false;
  try {
    await requerirAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function marcarHilo(formulario: FormData) {
  if (!(await soloAdmin())) return;
  const hilo = texto(formulario, "hilo_id");
  const leido = texto(formulario, "leido") === "true";
  await supabaseAdmin().from("correos").update({ leido }).eq("hilo_id", hilo).eq("direccion", "entrante");
  revalidatePath("/admin/correo", "layout");
  if (!leido) redirect("/admin/correo");
}

export async function archivarHilo(formulario: FormData) {
  if (!(await soloAdmin())) return;
  const hilo = texto(formulario, "hilo_id");
  const archivado = texto(formulario, "archivado") === "true";
  await supabaseAdmin().from("correos").update({ archivado }).eq("hilo_id", hilo);
  revalidatePath("/admin/correo", "layout");
  redirect(archivado ? "/admin/correo" : `/admin/correo/${hilo}`);
}
