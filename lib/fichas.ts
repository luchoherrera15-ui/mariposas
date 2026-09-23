/**
 * Ficha de referencia de cada especie. Son datos de la especie, no del negocio,
 * por eso viven en código y no en Supabase: no cambian de cliente a cliente.
 *
 * `envergadura` son rangos publicados en literatura entomológica. `vuelo` y
 * `disponibilidad` son los datos que pide un mariposario antes de comprar:
 * ajustá `disponibilidad` a la realidad de tus proveedores.
 */
export type Ficha = {
  envergadura: string;
  vuelo: string;
  disponibilidad: string;
};

export const FICHAS: Record<string, Ficha> = {
  "Morpho peleides": {
    envergadura: "95–120 mm",
    vuelo: "Alto y errático, en claros",
    disponibilidad: "Todo el año",
  },
  "Caligo memnon": {
    envergadura: "120–150 mm",
    vuelo: "Crepuscular, bajo",
    disponibilidad: "Todo el año",
  },
  "Danaus plexippus": {
    envergadura: "90–100 mm",
    vuelo: "Planeado, sostenido",
    disponibilidad: "Todo el año",
  },
  "Greta oto": {
    envergadura: "55–61 mm",
    vuelo: "Bajo, entre sotobosque",
    disponibilidad: "Todo el año",
  },
  "Heliconius charithonia": {
    envergadura: "72–100 mm",
    vuelo: "Lento y flotante",
    disponibilidad: "Todo el año",
  },
  "Papilio thoas": {
    envergadura: "100–130 mm",
    vuelo: "Rápido, con aleteo continuo",
    disponibilidad: "Todo el año",
  },
  "Siproeta stelenes": {
    envergadura: "60–80 mm",
    vuelo: "Medio, posa con frecuencia",
    disponibilidad: "Todo el año",
  },
  "Diaethria astala": {
    envergadura: "35–40 mm",
    vuelo: "Rápido y bajo",
    disponibilidad: "Marzo a octubre",
  },
};

export function ficha(nombreCientifico: string): Ficha | null {
  return FICHAS[nombreCientifico] ?? null;
}
