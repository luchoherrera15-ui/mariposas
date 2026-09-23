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

const SINGULARES: Record<string, string> = {
  semillas: "semilla",
  árboles: "árbol",
  horas: "hora",
  talleres: "taller",
};

/** Concuerda la unidad con la cantidad: 1 árbol / 25 árboles. */
export function unidadEn(cantidad: number, unidad: string) {
  return cantidad === 1 ? (SINGULARES[unidad] ?? unidad) : unidad;
}

/** Texto legible de la regla: "cada 25 mariposas = 1 árbol". */
export function textoRegla(proyecto: ProyectoImpacto) {
  if (!proyecto.regla) return null;
  const { mariposas_por_bloque, unidades_por_bloque } = proyecto.regla;
  const mariposas = mariposas_por_bloque === 1 ? "1 mariposa" : `${mariposas_por_bloque} mariposas`;
  const unidades = redondear(unidades_por_bloque);
  return `cada ${mariposas} = ${unidades} ${unidadEn(unidades, proyecto.unidad)}`;
}

/** Porcentaje de avance contra la meta anual, tope 100. */
export function avanceMeta(ejecutado: number, meta: number | null) {
  if (!meta || meta <= 0) return null;
  return Math.min(100, Math.round((ejecutado / meta) * 100));
}

function redondear(n: number) {
  return Math.round(n * 100) / 100;
}
