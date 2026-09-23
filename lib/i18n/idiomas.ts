/**
 * Idiomas del sitio público y del panel de clientes. El inglés es el idioma
 * principal: es el que ve quien entra por primera vez. El panel de /admin
 * queda en español porque lo usa la empresa.
 */
export const IDIOMAS = ["en", "es", "it", "fr", "zh"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_PRINCIPAL: Idioma = "en";

/** El contenido editable (catálogo, ajustes) se escribe en español en /admin. */
export const IDIOMA_BASE_CONTENIDO: Idioma = "es";

export const COOKIE_IDIOMA = "idioma";

/** Nombre de cada idioma escrito en ese mismo idioma, para el selector. */
export const NOMBRE_IDIOMA: Record<Idioma, string> = {
  en: "English",
  es: "Español",
  it: "Italiano",
  fr: "Français",
  zh: "中文",
};

/** Locale de Intl para números, monedas y fechas. */
export const LOCALE: Record<Idioma, string> = {
  en: "en-US",
  es: "es-CR",
  it: "it-IT",
  fr: "fr-FR",
  zh: "zh-CN",
};

export function esIdioma(valor: unknown): valor is Idioma {
  return typeof valor === "string" && (IDIOMAS as readonly string[]).includes(valor);
}

/** "Hola, {nombre}" + { nombre: "Ana" } → "Hola, Ana". */
export function fmt(texto: string, valores: Record<string, string | number>) {
  return texto.replace(/\{(\w+)\}/g, (_, clave: string) => String(valores[clave] ?? `{${clave}}`));
}
