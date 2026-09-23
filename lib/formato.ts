import { LOCALE, type Idioma } from "./i18n/idiomas";
import type { EstadoEnvio, EstadoPedido } from "./tipos";

const ZONA = "America/Costa_Rica";

/**
 * Formateadores en el idioma de la visita. El sitio público y el panel usan
 * `obtenerFormato()` (lib/i18n/servidor); las funciones sueltas de abajo son
 * las de /admin, que va siempre en español.
 */
export function crearFormato(idioma: Idioma) {
  const locale = LOCALE[idioma];
  return {
    moneda(valor: number, codigo = "USD") {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: codigo,
        maximumFractionDigits: 2,
      }).format(valor);
    },
    numero(valor: number, decimales = 0) {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimales,
      }).format(valor);
    },
    fecha(valor: string | null) {
      if (!valor) return "—";
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: ZONA,
      }).format(new Date(valor));
    },
    fechaHora(valor: string | null) {
      if (!valor) return "—";
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: ZONA,
      }).format(new Date(valor));
    },
  };
}

export type Formato = ReturnType<typeof crearFormato>;

const formatoAdmin = crearFormato("es");
export const moneda = formatoAdmin.moneda;
export const numero = formatoAdmin.numero;
export const fecha = formatoAdmin.fecha;
export const fechaHora = formatoAdmin.fechaHora;

export const etiquetaPedido: Record<EstadoPedido, string> = {
  pendiente: "Pendiente de pago",
  confirmado: "Confirmado",
  preparando: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const etiquetaEnvio: Record<EstadoEnvio, string> = {
  preparando: "En preparación",
  en_transito: "En tránsito",
  en_aduana: "En aduana",
  en_reparto: "En reparto",
  entregado: "Entregado",
  incidencia: "Con incidencia",
};

/** Clases Tailwind del chip de estado, por estado de pedido. */
export const colorPedido: Record<EstadoPedido, string> = {
  pendiente: "bg-amber-100 text-amber-900 ring-amber-200",
  confirmado: "bg-sky-100 text-sky-900 ring-sky-200",
  preparando: "bg-violet-100 text-violet-900 ring-violet-200",
  enviado: "bg-blue-100 text-blue-900 ring-blue-200",
  entregado: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  cancelado: "bg-stone-200 text-stone-700 ring-stone-300",
};

export const colorEnvio: Record<EstadoEnvio, string> = {
  preparando: "bg-violet-100 text-violet-900 ring-violet-200",
  en_transito: "bg-blue-100 text-blue-900 ring-blue-200",
  en_aduana: "bg-amber-100 text-amber-900 ring-amber-200",
  en_reparto: "bg-sky-100 text-sky-900 ring-sky-200",
  entregado: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  incidencia: "bg-rose-100 text-rose-900 ring-rose-200",
};

/** Progreso 0-100 de un envío, para la barra del tracking. */
export function progresoEnvio(estado: EstadoEnvio) {
  const pasos: Record<EstadoEnvio, number> = {
    preparando: 15,
    en_transito: 45,
    en_aduana: 65,
    en_reparto: 85,
    entregado: 100,
    incidencia: 50,
  };
  return pasos[estado] ?? 0;
}
