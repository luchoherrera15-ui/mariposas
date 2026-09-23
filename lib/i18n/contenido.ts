import { IDIOMA_BASE_CONTENIDO, type Idioma } from "./idiomas";

/**
 * El contenido editable (catálogo, proyectos, bitácora, ajustes) se guarda en
 * español en sus columnas de siempre, y las traducciones en una columna
 * `traducciones` jsonb: { "en": { "nombre": "…" }, "it": { … } }.
 * Si falta una traducción se muestra el español: mejor eso que un hueco.
 */
export type Traducciones = Partial<Record<Idioma, Record<string, string>>> | null | undefined;

export function traducir<T extends Record<string, unknown>>(
  fila: T & { traducciones?: unknown },
  idioma: Idioma,
  campos: (keyof T & string)[],
): T {
  if (idioma === IDIOMA_BASE_CONTENIDO) return fila;
  const propias = (fila.traducciones as Traducciones)?.[idioma];
  if (!propias) return fila;
  const copia = { ...fila };
  for (const campo of campos) {
    const valor = propias[campo];
    if (typeof valor === "string" && valor.trim() !== "") (copia as Record<string, unknown>)[campo] = valor;
  }
  return copia;
}
