import type { Idioma } from "./i18n/idiomas";

/**
 * Ficha de referencia de cada especie. Son datos de la especie, no del negocio,
 * por eso viven en código y no en Supabase: no cambian de cliente a cliente.
 *
 * `envergadura` son rangos publicados en literatura entomológica. `vuelo` y
 * `disponibilidad` son los datos que pide un mariposario antes de comprar:
 * ajustá `disponibilidad` a la realidad de tus proveedores (en los cinco idiomas).
 */
type Texto = Record<Idioma, string>;

const FICHAS: Record<string, { envergadura: string; vuelo: Texto; disponibilidad: Texto }> = {
  "Morpho peleides": {
    envergadura: "95–120 mm",
    vuelo: { en: "High and erratic, in clearings", es: "Alto y errático, en claros", it: "Alto e irregolare, nelle radure", fr: "Haut et erratique, dans les clairières", zh: "高飞且飞行轨迹不规则，常见于林间空地" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Caligo memnon": {
    envergadura: "120–150 mm",
    vuelo: { en: "Low, at dusk", es: "Crepuscular, bajo", it: "Crepuscolare, basso", fr: "Crépusculaire, bas", zh: "晨昏活动，低飞" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Danaus plexippus": {
    envergadura: "90–100 mm",
    vuelo: { en: "Gliding, sustained", es: "Planeado, sostenido", it: "Planato, prolungato", fr: "Plané, soutenu", zh: "滑翔，持久飞行" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Greta oto": {
    envergadura: "55–61 mm",
    vuelo: { en: "Low, through the understory", es: "Bajo, entre sotobosque", it: "Basso, nel sottobosco", fr: "Bas, dans le sous-bois", zh: "低飞，穿行于林下植被间" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Heliconius charithonia": {
    envergadura: "72–100 mm",
    vuelo: { en: "Slow and floating", es: "Lento y flotante", it: "Lento e fluttuante", fr: "Lent et flottant", zh: "缓慢，似漂浮" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Papilio thoas": {
    envergadura: "100–130 mm",
    vuelo: { en: "Fast, with constant wingbeats", es: "Rápido, con aleteo continuo", it: "Rapido, con battito d'ali continuo", fr: "Rapide, avec des battements d'ailes continus", zh: "快速，持续振翅" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Siproeta stelenes": {
    envergadura: "60–80 mm",
    vuelo: { en: "Moderate, lands often", es: "Medio, posa con frecuencia", it: "Medio, si posa spesso", fr: "Moyen, se pose fréquemment", zh: "中等高度，经常停歇" },
    disponibilidad: { en: "Year-round", es: "Todo el año", it: "Tutto l'anno", fr: "Toute l'année", zh: "全年供应" },
  },
  "Diaethria astala": {
    envergadura: "35–40 mm",
    vuelo: { en: "Fast and low", es: "Rápido y bajo", it: "Rapido e basso", fr: "Rapide et bas", zh: "快速且低飞" },
    disponibilidad: { en: "March to October", es: "Marzo a octubre", it: "Da marzo a ottobre", fr: "De mars à octobre", zh: "3 月至 10 月" },
  },
};

export type Ficha = { envergadura: string; vuelo: string; disponibilidad: string };

export function ficha(nombreCientifico: string, idioma: Idioma): Ficha | null {
  const f = FICHAS[nombreCientifico];
  if (!f) return null;
  return { envergadura: f.envergadura, vuelo: f.vuelo[idioma], disponibilidad: f.disponibilidad[idioma] };
}
