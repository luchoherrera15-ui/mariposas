export type EstadoPedido =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado";

export type EstadoEnvio =
  | "preparando"
  | "en_transito"
  | "en_aduana"
  | "en_reparto"
  | "entregado"
  | "incidencia";

export type Especie = {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string | null;
  region: string | null;
  /** Solo en /admin: el sitio público no recibe precios. */
  precio_unitario?: number;
  descripcion: string | null;
  emoji: string | null;
};

export type ItemPedido = {
  id: string;
  cantidad: number;
  precio_unitario: number;
  especie: Pick<Especie, "nombre_comun" | "nombre_cientifico" | "emoji"> | null;
};

export type EnvioEvento = {
  id: string;
  ocurrido_en: string;
  estado: string;
  ubicacion: string | null;
  descripcion: string | null;
};

export type Envio = {
  id: string;
  transportista: string | null;
  numero_guia: string | null;
  url_rastreo: string | null;
  estado: EstadoEnvio;
  origen: string | null;
  destino: string | null;
  enviado_en: string | null;
  entrega_estimada: string | null;
  entregado_en: string | null;
  temperatura_c: number | null;
  eventos?: EnvioEvento[];
};

export type Pedido = {
  id: string;
  codigo: string;
  estado: EstadoPedido;
  total: number;
  moneda: string;
  notas: string | null;
  creado_en: string;
  items: ItemPedido[];
  envio: Envio | null;
};

export type ReglaImpacto = {
  mariposas_por_bloque: number;
  unidades_por_bloque: number;
};

export type ProyectoImpacto = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  /** "árbol" frente a "árboles"; en chino suele ser igual a `unidad`. */
  unidad_singular: string;
  emoji: string | null;
  meta_anual: number | null;
  orden: number;
  /** unidades realmente ejecutadas y documentadas */
  ejecutado: number;
  regla: ReglaImpacto | null;
};

export type RegistroImpacto = {
  id: string;
  proyecto: string;
  cantidad: number;
  unidad: string;
  fecha: string;
  detalle: string | null;
};

export type ResumenCliente = {
  mariposas: number;
  pedidos: number;
  enTransito: number;
  invertido: number;
  moneda: string;
};
