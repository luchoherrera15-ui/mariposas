import { fmt } from "./i18n/idiomas";
import type { Textos } from "./i18n/textos";
import type { ProyectoImpacto } from "./tipos";

export type AporteCliente = {
  proyecto: ProyectoImpacto;
  /** unidades generadas por las compras de este cliente */
  aporte: number;
  /** cuántas mariposas más faltan para la siguiente unidad */
  faltanParaLaSiguiente: number;
};

/**
 * Convierte las mariposas compradas por un cliente en unidades de impacto,
 * aplicando la regla de cada proyecto: "cada N mariposas => X unidades".
 *
 * La regla vive en la tabla `reglas_impacto`, así que se puede ajustar sin
 * tocar código y el panel se recalcula solo.
 */
export function calcularAportes(mariposas: number, proyectos: ProyectoImpacto[]): AporteCliente[] {
  return proyectos
    .filter((p) => p.regla !== null)
    .map((proyecto) => {
      const { mariposas_por_bloque, unidades_por_bloque } = proyecto.regla!;
      const bloques = Math.floor(mariposas / mariposas_por_bloque);
      const restante = mariposas % mariposas_por_bloque;
      return {
        proyecto,
        aporte: redondear(bloques * unidades_por_bloque),
        faltanParaLaSiguiente: restante === 0 ? mariposas_por_bloque : mariposas_por_bloque - restante,
      };
    });
}

/** Concuerda la unidad con la cantidad: 1 árbol / 25 árboles. */
export function unidadEn(cantidad: number, proyecto: Pick<ProyectoImpacto, "unidad" | "unidad_singular">) {
  return cantidad === 1 ? proyecto.unidad_singular || proyecto.unidad : proyecto.unidad;
}

/** Texto legible de la regla: "cada 25 mariposas = 1 árbol", en el idioma de la visita. */
export function textoRegla(proyecto: ProyectoImpacto, t: Textos) {
  if (!proyecto.regla) return null;
  const { mariposas_por_bloque, unidades_por_bloque } = proyecto.regla;
  const mariposas =
    mariposas_por_bloque === 1 ? t.comun.reglaUna : fmt(t.comun.reglaVarias, { n: mariposas_por_bloque });
  const unidades = redondear(unidades_por_bloque);
  return fmt(t.comun.regla, { mariposas, unidades: `${unidades} ${unidadEn(unidades, proyecto)}` });
}

/** Porcentaje de avance contra la meta anual, tope 100. */
export function avanceMeta(ejecutado: number, meta: number | null) {
  if (!meta || meta <= 0) return null;
  return Math.min(100, Math.round((ejecutado / meta) * 100));
}

function redondear(n: number) {
  return Math.round(n * 100) / 100;
}
