/**
 * Puente entre el catálogo (que vive en Supabase) y las fotos descargadas
 * (que viven en public/fotos). La clave es el nombre científico, que es lo
 * único estable: los nombres comunes cambian de país a país.
 */
export const FOTO_POR_ESPECIE: Record<string, string> = {
  "Morpho peleides": "morpho-azul",
  "Caligo memnon": "buho-gigante",
  "Danaus plexippus": "monarca",
  "Greta oto": "alas-de-cristal",
  "Heliconius charithonia": "cebra",
  "Papilio thoas": "cola-de-golondrina",
  "Siproeta stelenes": "malaquita",
  "Diaethria astala": "ochenta-y-ocho",
};

/** Las 8 originales tienen slug en español; las demás, el nombre científico en kebab-case. */
export function slugDeEspecie(nombreCientifico: string) {
  return FOTO_POR_ESPECIE[nombreCientifico] ?? nombreCientifico.trim().toLowerCase().replace(/\s+/g, "-");
}
