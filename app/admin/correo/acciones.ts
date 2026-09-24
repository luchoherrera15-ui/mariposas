"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bloqueoDemo, requerirAdmin } from "@/lib/admin";
import {
  BUCKET_CORREO,
  LIMITE_ADJUNTOS_BYTES,
  buzonConfigurado,
  enviarDesdeBuzon,
  guardarFirmaDe,
  nombreSeguro,
  type Adjunto,
} from "@/lib/buzon";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import type { Resultado } from "../acciones";

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Adjuntos que manda el editor como JSON en un campo oculto. */
function leerAdjuntos(f: FormData): Adjunto[] {
  try {
    const lista = JSON.parse(String(f.get("adjuntos") || "[]"));
    if (!Array.isArray(lista)) return [];
    return lista
      .filter((a) => a && typeof a.ruta === "string" && typeof a.nombre === "string")
      .map((a) => ({ ruta: a.ruta, nombre: a.nombre, tipo: String(a.tipo || "application/octet-stream"), bytes: Number(a.bytes) || 0 }));
  } catch {
    return [];
  }
}

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
      cuerpoHtml: String(formulario.get("cuerpo_html") ?? ""),
      adjuntos: leerAdjuntos(formulario),
      responderA: texto(formulario, "responder_a") || null,
      usuarioId: admin.id,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo enviar." };
  }

  revalidatePath("/admin/correo", "layout");
  redirect(`/admin/correo/${hilo}?enviado=1`);
}

/**
 * El navegador sube cada adjunto directo a Storage con una URL firmada que
 * genera esta acción (así el archivo no pasa por Vercel, que corta a 4,5 MB).
 */
export async function prepararSubida(nombre: string, bytes: number) {
  if (!(await soloAdmin())) return { error: "Sin permiso." };
  if (!Number.isFinite(bytes) || bytes <= 0) return { error: "Archivo vacío." };
  if (bytes > LIMITE_ADJUNTOS_BYTES) return { error: "El archivo pasa de 25 MB." };
  const ruta = `salientes/${crypto.randomUUID()}/${nombreSeguro(nombre)}`;
  const { data, error } = await supabaseAdmin().storage.from(BUCKET_CORREO).createSignedUploadUrl(ruta);
  if (error || !data) return { error: error?.message ?? "No se pudo preparar la subida." };
  return { ruta, token: data.token };
}

export async function guardarFirma(_previo: Resultado, formulario: FormData): Promise<Resultado> {
  const demo = bloqueoDemo();
  if (demo) return demo;
  try {
    const admin = await requerirAdmin();
    await guardarFirmaDe(admin.id, String(formulario.get("cuerpo_html") ?? "").trim());
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo guardar." };
  }
  revalidatePath("/admin/correo", "layout");
  return { ok: "Firma guardada. Se agrega sola en cada correo nuevo y en cada respuesta." };
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
