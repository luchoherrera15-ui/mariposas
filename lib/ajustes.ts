import "server-only";
import { modoDemo } from "./config";
import { supabaseServidor } from "./supabase-servidor";

/**
 * Textos y cifras del sitio público. Viven en la tabla `ajustes` y se editan
 * desde /admin/ajustes. Los valores de acá abajo son solo el respaldo: se usan
 * en modo demostración y si falta una clave en la base.
 */
export const AJUSTES_POR_DEFECTO = {
  marca_nombre: "Tropical Butterfly Exports",
  marca_descripcion:
    "Comercialización y exportación de mariposas tropicales vivas desde Costa Rica, con impacto social medible.",
  marca_correo: "ventas@tropicalbutterflyexports.com",
  marca_telefono: "+506 8888 8888",
  marca_ubicacion: "San Rafael de Alajuela, Costa Rica",
  marca_pie:
    "Comercializadora y exportadora de mariposas tropicales vivas. San Rafael de Alajuela, Costa Rica.",

  inicio_titular: "Salen en pupa de Costa Rica y abren en tu mariposario.",
  inicio_entradilla:
    "Comercializamos ocho especies tropicales y las exportamos vivas a mariposarios, museos y centros de ciencia. Trabajamos con criaderos costarricenses, con cadena de frío registrada de punta a punta y reposición de toda pupa que no abra.",

  cifra1_valor: "38 420",
  cifra1_texto: "mariposas exportadas desde 2019",
  cifra2_valor: "97,4 %",
  cifra2_texto: "abren sanas al llegar a destino",
  cifra3_valor: "11",
  cifra3_texto: "países con envíos recurrentes",

  ciclo_titulo: "Nueve días desde que cerrás el pedido",
  ciclo_texto:
    "La pupa aguanta entre diez y catorce días antes de abrir. Todo el proceso está calzado para que llegue con margen, no justo.",
  ciclo_pasos: [
    "0|Confirmación|Cerramos especies, cantidades y fecha de vuelo.",
    "3|Acopio y selección|Recibimos de los criaderos y descartamos toda pupa dudosa.",
    "5|Empaque en frío|Algodón, gel refrigerante y registrador de temperatura.",
    "9|Entrega|Aduana, inspección fitosanitaria y puerta del mariposario.",
  ].join("\n"),

  envio_condiciones: [
    "Mínimo por especie|25 pupas",
    "Temperatura de tránsito|13 °C a 16 °C",
    "Documentos incluidos|Permiso CITES y certificado fitosanitario",
    "Pupas no viables|Se reponen sin costo en el siguiente envío",
  ].join("\n"),
  envio_texto:
    "Se exportan en fase de pupa, que es cuando el insecto aguanta el traslado. Van en bandejas de algodón con gel refrigerante y un registrador de temperatura que se lee al abrir la caja.",
};

export type ClaveAjuste = keyof typeof AJUSTES_POR_DEFECTO;
export type Ajustes = Record<ClaveAjuste, string>;

export async function obtenerAjustes(): Promise<Ajustes> {
  const valores = { ...AJUSTES_POR_DEFECTO } as Ajustes;
  if (modoDemo) return valores;

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("ajustes").select("clave, valor");
  if (error || !data) {
    // Si todavía no corrieron 005_ajustes.sql, el sitio sigue funcionando.
    return valores;
  }
  for (const fila of data) {
    const clave = fila.clave as ClaveAjuste;
    if (clave in valores && typeof fila.valor === "string" && fila.valor.trim() !== "") {
      valores[clave] = fila.valor;
    }
  }
  return valores;
}

/** Datos de la empresa, que es lo que usan el encabezado y el pie. */
export async function obtenerMarca() {
  const a = await obtenerAjustes();
  return {
    nombre: a.marca_nombre,
    descripcionCorta: a.marca_descripcion,
    correo: a.marca_correo,
    telefono: a.marca_telefono,
    ubicacion: a.marca_ubicacion,
    pie: a.marca_pie,
  };
}

/** "0|Confirmación|Cerramos…" por línea → objetos. */
export function leerPasos(texto: string) {
  return texto
    .split("\n")
    .map((linea) => linea.split("|").map((p) => p.trim()))
    .filter((partes) => partes.length >= 2 && partes[1])
    .map(([dia, titulo, detalle]) => ({ dia, titulo, detalle: detalle ?? "" }));
}

/** "Etiqueta|Valor" por línea → pares. */
export function leerPares(texto: string) {
  return texto
    .split("\n")
    .map((linea) => linea.split("|").map((p) => p.trim()))
    .filter((partes) => partes.length >= 2 && partes[0] && partes[1])
    .map(([etiqueta, valor]) => ({ etiqueta, valor }));
}
