"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { obtenerMarca } from "@/lib/ajustes";
import { modoDemo } from "@/lib/config";
import { enviarCodigoPorCorreo, hayCorreo } from "@/lib/correo";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";
import { supabaseAdmin, supabaseServidor } from "@/lib/supabase-servidor";

export type EstadoFormulario = {
  error?: string;
  aviso?: string;
  /** Tras mandar el código, el formulario pasa a pedirlo. */
  paso?: "codigo";
  email?: string;
  nombre?: string;
} | null;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESPERA_ENTRE_CODIGOS_MS = 45_000;
const VENTANA_MS = 15 * 60_000;
const MAXIMO_POR_VENTANA = 5;

function leer(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

/**
 * auth.users se comparte con otra app del mismo proyecto de Supabase: alguien
 * puede tener cuenta allá y entrar acá por primera vez. En ese caso todavía no
 * tiene perfil de mariposas, así que se crea (sin aprobar).
 */
async function asegurarPerfil(usuario: { id: string; email?: string; user_metadata?: Record<string, unknown> }, nombre?: string) {
  const email = usuario.email ?? "";
  const { error } = await supabaseAdmin()
    .from("perfiles")
    .upsert(
      {
        id: usuario.id,
        nombre: nombre || (usuario.user_metadata?.nombre as string | undefined) || email.split("@")[0],
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) console.error("asegurarPerfil:", error.message);
}

// ─── Entrar con contraseña ───────────────────────────────────────────────────

export async function entrar(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (modoDemo) redirect("/panel");
  const t = (await obtenerTextos()).entrar.errores;

  const email = leer(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: t.faltaContrasena };

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { error: error?.message === "Invalid login credentials" ? t.credenciales : t.generico };
  }

  await asegurarPerfil(data.user);
  revalidatePath("/", "layout");
  redirect("/panel");
}

// ─── Entrar (o crear la cuenta) con un código por correo ─────────────────────

export async function enviarCodigo(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (modoDemo) redirect("/panel");
  const t = (await obtenerTextos()).entrar.errores;

  const email = leer(formData, "email").toLowerCase();
  const nombre = leer(formData, "nombre");
  if (!email) return { error: t.faltaCorreo };
  if (!CORREO_VALIDO.test(email)) return { error: t.correoInvalido };
  if (!hayCorreo()) return { error: t.sinCorreo };

  const admin = supabaseAdmin();

  // Límite anti-abuso: un código cada 45 s y 5 cada 15 min por correo.
  const { data: recientes } = await admin
    .from("codigos_enviados")
    .select("enviado_en")
    .eq("email", email)
    .gte("enviado_en", new Date(Date.now() - VENTANA_MS).toISOString())
    .order("enviado_en", { ascending: false });
  if ((recientes?.length ?? 0) >= MAXIMO_POR_VENTANA) return { error: t.demasiados };
  if (recientes?.[0] && Date.now() - new Date(recientes[0].enviado_en).getTime() < ESPERA_ENTRE_CODIGOS_MS) {
    return { error: t.esperar, paso: "codigo", email, nombre };
  }

  // Si el correo no existe, se crea la cuenta. Queda confirmada porque solo
  // se puede entrar con el código que llega a ese buzón. Si ya existe (por
  // ejemplo, de la otra app), Supabase avisa y seguimos con esa misma cuenta.
  const { error: errorAlta } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { app: "mariposas", nombre: nombre || email.split("@")[0] },
  });
  if (errorAlta && errorAlta.code !== "email_exists") {
    console.error("enviarCodigo/createUser:", errorAlta.message);
    return { error: t.generico };
  }

  // generateLink no manda correo: solo devuelve el código, y lo mandamos
  // nosotros con la marca y el idioma del sitio.
  const { data: enlace, error: errorEnlace } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const codigo = enlace?.properties?.email_otp;
  if (errorEnlace || !codigo) {
    console.error("enviarCodigo/generateLink:", errorEnlace?.message);
    return { error: t.generico };
  }

  try {
    const [idioma, marca] = await Promise.all([obtenerIdioma(), obtenerMarca()]);
    await enviarCodigoPorCorreo({ email, codigo, idioma, marca: marca.nombre });
  } catch (error) {
    console.error("enviarCodigo/correo:", error instanceof Error ? error.message : error);
    return { error: t.generico };
  }

  await admin.from("codigos_enviados").insert({ email });
  return { paso: "codigo", email, nombre };
}

export async function verificarCodigo(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (modoDemo) redirect("/panel");
  const t = (await obtenerTextos()).entrar.errores;

  const email = leer(formData, "email").toLowerCase();
  const nombre = leer(formData, "nombre");
  const codigo = leer(formData, "codigo").replace(/\D/g, "");
  if (!codigo) return { error: t.faltaCodigo, paso: "codigo", email, nombre };

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error || !data.user) return { error: t.codigoInvalido, paso: "codigo", email, nombre };

  await asegurarPerfil(data.user, nombre);
  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function salir() {
  if (!modoDemo) {
    const supabase = await supabaseServidor();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
