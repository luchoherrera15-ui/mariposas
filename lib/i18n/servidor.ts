import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { crearFormato } from "../formato";
import { COOKIE_IDIOMA, IDIOMA_PRINCIPAL, esIdioma, type Idioma } from "./idiomas";
import { TEXTOS } from "./textos";

/**
 * Idioma de la visita: el que eligió en el selector (cookie) o el principal.
 * `cache` lo resuelve una sola vez por request aunque lo pidan varias partes.
 */
export const obtenerIdioma = cache(async (): Promise<Idioma> => {
  const valor = (await cookies()).get(COOKIE_IDIOMA)?.value;
  return esIdioma(valor) ? valor : IDIOMA_PRINCIPAL;
});

export async function obtenerTextos() {
  return TEXTOS[await obtenerIdioma()];
}

/** Números, monedas y fechas con el formato del idioma de la visita. */
export async function obtenerFormato() {
  return crearFormato(await obtenerIdioma());
}
