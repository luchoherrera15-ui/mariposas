"use server";

import { cookies } from "next/headers";
import { COOKIE_IDIOMA, esIdioma } from "./idiomas";

/** Guarda el idioma elegido por un año. Next vuelve a pintar la página sola. */
export async function cambiarIdioma(formulario: FormData) {
  const idioma = formulario.get("idioma");
  if (!esIdioma(idioma)) return;
  (await cookies()).set(COOKIE_IDIOMA, idioma, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
