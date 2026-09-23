"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { modoDemo } from "@/lib/config";
import { supabaseServidor } from "@/lib/supabase-servidor";

export type EstadoFormulario = { error?: string; aviso?: string } | null;

function leerCredenciales(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    nombre: String(formData.get("nombre") ?? "").trim(),
  };
}

export async function entrar(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (modoDemo) redirect("/panel");

  const { email, password } = leerCredenciales(formData);
  if (!email || !password) return { error: "Escribí tu correo y tu contraseña." };

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : `No se pudo entrar: ${error.message}`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/panel");
}

export async function registrarse(_previo: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (modoDemo) redirect("/panel");

  const { email, password, nombre } = leerCredenciales(formData);
  if (!email || !password) return { error: "Escribí tu correo y una contraseña." };
  if (password.length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // "app" le avisa al trigger de la base que este usuario es de mariposas
    // (auth.users se comparte con la otra app del mismo proyecto).
    options: {
      data: { app: "mariposas", nombre: nombre || email.split("@")[0] },
      // Sin esto el enlace del correo lleva al Site URL del proyecto, que es
      // de la otra app. Así vuelve al dominio desde donde se registró.
      emailRedirectTo: `${(await headers()).get("origin")}/entrar`,
    },
  });
  if (error) return { error: `No se pudo crear la cuenta: ${error.message}` };

  // Si Supabase tiene la confirmación por correo activada no hay sesión todavía.
  if (!data.session) {
    return { aviso: "Cuenta creada. Revisá tu correo para confirmarla y luego entrá." };
  }

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
