import type { Especie, Pedido, ProyectoImpacto, RegistroImpacto } from "./tipos";

/**
 * Datos de demostración en memoria. Reflejan exactamente lo que insertan
 * supabase/migraciones/002 y 003, para que el sitio se pueda ver y presentar
 * antes de configurar Supabase.
 */

const hace = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();
const enDias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

export const especiesDemo: Especie[] = [
  { id: "e1", nombre_comun: "Morpho azul", nombre_cientifico: "Morpho peleides", familia: "Nymphalidae", region: "Costa Rica", precio_unitario: 8.5, descripcion: "El clásico azul metálico. Alta demanda en exhibiciones y eventos.", emoji: "🦋" },
  { id: "e2", nombre_comun: "Búho gigante", nombre_cientifico: "Caligo memnon", familia: "Nymphalidae", region: "Costa Rica", precio_unitario: 6.75, descripcion: "Enormes ocelos que imitan ojos de búho. Muy resistente al transporte.", emoji: "🦉" },
  { id: "e3", nombre_comun: "Monarca", nombre_cientifico: "Danaus plexippus", familia: "Nymphalidae", region: "Mesoamérica", precio_unitario: 4.2, descripcion: "Icono de la migración. Ideal para programas educativos.", emoji: "🧡" },
  { id: "e4", nombre_comun: "Alas de cristal", nombre_cientifico: "Greta oto", familia: "Nymphalidae", region: "Costa Rica", precio_unitario: 9.9, descripcion: "Alas transparentes. La favorita de los fotógrafos.", emoji: "💎" },
  { id: "e5", nombre_comun: "Cebra de alas largas", nombre_cientifico: "Heliconius charithonia", familia: "Nymphalidae", region: "Centroamérica", precio_unitario: 3.8, descripcion: "Vuelo lento y llamativo. Excelente para mariposarios abiertos.", emoji: "🖤" },
  { id: "e6", nombre_comun: "Cola de golondrina", nombre_cientifico: "Papilio thoas", familia: "Papilionidae", region: "Costa Rica", precio_unitario: 7.4, descripcion: "Amarillo intenso con colas pronunciadas.", emoji: "💛" },
  { id: "e7", nombre_comun: "Malaquita", nombre_cientifico: "Siproeta stelenes", familia: "Nymphalidae", region: "Costa Rica", precio_unitario: 5.6, descripcion: "Verde jade translúcido. Muy longeva en cautiverio.", emoji: "💚" },
  { id: "e8", nombre_comun: "Ochenta y ocho", nombre_cientifico: "Diaethria astala", familia: "Nymphalidae", region: "Costa Rica", precio_unitario: 6.1, descripcion: 'El "88" dibujado en las alas inferiores.', emoji: "🔢" },
];

export const proyectosDemo: ProyectoImpacto[] = [
  {
    id: "p1", slug: "semillas-manzano", nombre: "Semillas de manzano sembradas",
    descripcion: "Compramos y sembramos semillas de manzano con familias de la zona alta para diversificar sus cultivos.",
    unidad: "semillas", unidad_singular: "semilla", emoji: "🍎", meta_anual: 12000, orden: 1, ejecutado: 8650,
    regla: { mariposas_por_bloque: 1, unidades_por_bloque: 3 },
  },
  {
    id: "p2", slug: "arboles-nativos", nombre: "Árboles nativos plantados",
    descripcion: "Reforestación con especies hospederas de mariposas: madero negro, guarumo, pasiflora.",
    unidad: "árboles", unidad_singular: "árbol", emoji: "🌳", meta_anual: 2500, orden: 2, ejecutado: 1030,
    regla: { mariposas_por_bloque: 25, unidades_por_bloque: 1 },
  },
  {
    id: "p3", slug: "metros-conservados", nombre: "Bosque en conservación",
    descripcion: "Metros cuadrados de bosque bajo acuerdo de no tala financiados con las ventas.",
    unidad: "m²", unidad_singular: "m²", emoji: "🌿", meta_anual: 80000, orden: 3, ejecutado: 44500,
    regla: { mariposas_por_bloque: 5, unidades_por_bloque: 10 },
  },
  {
    id: "p4", slug: "horas-empleo", nombre: "Horas de empleo rural",
    descripcion: "Horas pagadas a las familias criadoras que nos abastecen, la mayoría encabezadas por mujeres.",
    unidad: "horas", unidad_singular: "hora", emoji: "🧑‍🌾", meta_anual: 9000, orden: 4, ejecutado: 5840,
    regla: { mariposas_por_bloque: 4, unidades_por_bloque: 1 },
  },
  {
    id: "p5", slug: "talleres-escolares", nombre: "Talleres escolares de ecología",
    descripcion: "Talleres gratuitos en escuelas rurales sobre polinizadores y ciclo de vida.",
    unidad: "talleres", unidad_singular: "taller", emoji: "🎓", meta_anual: 60, orden: 5, ejecutado: 29,
    regla: { mariposas_por_bloque: 500, unidades_por_bloque: 1 },
  },
];

export const registrosDemo: RegistroImpacto[] = [
  { id: "r1", proyecto: "Semillas de manzano sembradas", cantidad: 4200, unidad: "semillas", fecha: "2026-02-10", detalle: "Entrega a 14 familias de Cerro Alto" },
  { id: "r2", proyecto: "Bosque en conservación", cantidad: 28000, unidad: "m²", fecha: "2026-01-15", detalle: "Acuerdo de conservación finca San Isidro" },
  { id: "r3", proyecto: "Árboles nativos plantados", cantidad: 620, unidad: "árboles", fecha: "2026-03-22", detalle: "Jornada de reforestación Día del Agua" },
  { id: "r4", proyecto: "Horas de empleo rural", cantidad: 3100, unidad: "horas", fecha: "2026-04-30", detalle: "Primer cuatrimestre: 9 familias criadoras" },
  { id: "r5", proyecto: "Semillas de manzano sembradas", cantidad: 2600, unidad: "semillas", fecha: "2026-05-18", detalle: "Segunda entrega + capacitación de injerto" },
  { id: "r6", proyecto: "Talleres escolares de ecología", cantidad: 18, unidad: "talleres", fecha: "2026-05-30", detalle: "Escuelas de San Rafael y Río Segundo" },
  { id: "r7", proyecto: "Bosque en conservación", cantidad: 16500, unidad: "m²", fecha: "2026-06-30", detalle: "Ampliación del acuerdo, sector norte" },
  { id: "r8", proyecto: "Árboles nativos plantados", cantidad: 410, unidad: "árboles", fecha: "2026-07-05", detalle: "Corredor biológico quebrada Los Ángeles" },
  { id: "r9", proyecto: "Semillas de manzano sembradas", cantidad: 1850, unidad: "semillas", fecha: "2026-08-02", detalle: "Vivero comunitario de La Cima" },
  { id: "r10", proyecto: "Talleres escolares de ecología", cantidad: 11, unidad: "talleres", fecha: "2026-08-20", detalle: "Circuito escolar de Sarapiquí" },
  { id: "r11", proyecto: "Horas de empleo rural", cantidad: 2740, unidad: "horas", fecha: "2026-08-31", detalle: "Segundo cuatrimestre: 11 familias criadoras" },
];

const esp = (i: number) => ({
  nombre_comun: especiesDemo[i].nombre_comun,
  nombre_cientifico: especiesDemo[i].nombre_cientifico,
  emoji: especiesDemo[i].emoji,
});

export const pedidosDemo: Pedido[] = [
  {
    id: "d1", codigo: "MAR-01001", estado: "entregado", total: 1253.0, moneda: "USD",
    notas: "Exhibición de verano — entrega en dos tandas", creado_en: hace(62),
    items: [
      { id: "i1", cantidad: 80, precio_unitario: 8.5, especie: esp(0) },
      { id: "i2", cantidad: 60, precio_unitario: 6.75, especie: esp(1) },
      { id: "i3", cantidad: 40, precio_unitario: 4.2, especie: esp(2) },
    ],
    envio: {
      id: "s1", transportista: "DHL Express", numero_guia: "DHL7742108833",
      url_rastreo: "https://www.dhl.com/es-es/home/rastreo.html?tracking-id=DHL7742108833",
      estado: "entregado", origen: "San Rafael de Alajuela, CR", destino: "Miami, FL, USA",
      enviado_en: hace(60), entrega_estimada: hace(56).slice(0, 10), entregado_en: hace(57), temperatura_c: 14.5,
      eventos: [
        { id: "v1", ocurrido_en: hace(57), estado: "entregado", ubicacion: "Miami, FL", descripcion: "Recibido por M. Álvarez. 180 pupas viables de 180" },
        { id: "v2", ocurrido_en: hace(58), estado: "en_reparto", ubicacion: "Miami, FL", descripcion: "En vehículo de reparto" },
        { id: "v3", ocurrido_en: hace(59), estado: "en_aduana", ubicacion: "Miami, FL", descripcion: "Inspección USDA APHIS aprobada" },
        { id: "v4", ocurrido_en: hace(60), estado: "en_transito", ubicacion: "SJO Aeropuerto", descripcion: "Salida del centro de origen" },
        { id: "v5", ocurrido_en: hace(61), estado: "preparando", ubicacion: "San Rafael de Alajuela, CR", descripcion: "Pupas seleccionadas y empacadas en frío" },
      ],
    },
  },
  {
    id: "d2", codigo: "MAR-01002", estado: "enviado", total: 910.5, moneda: "USD",
    notas: "Reposición mensual", creado_en: hace(9),
    items: [
      { id: "i4", cantidad: 45, precio_unitario: 9.9, especie: esp(3) },
      { id: "i5", cantidad: 50, precio_unitario: 5.6, especie: esp(6) },
      { id: "i6", cantidad: 25, precio_unitario: 7.4, especie: esp(5) },
    ],
    envio: {
      id: "s2", transportista: "FedEx International", numero_guia: "FDX881204557719",
      url_rastreo: "https://www.fedex.com/fedextrack/?trknbr=FDX881204557719",
      estado: "en_aduana", origen: "San Rafael de Alajuela, CR", destino: "Ámsterdam, NL",
      enviado_en: hace(4), entrega_estimada: enDias(2), entregado_en: null, temperatura_c: 13.8,
      eventos: [
        { id: "v6", ocurrido_en: hace(1), estado: "en_aduana", ubicacion: "Schiphol, NL", descripcion: "En revisión aduanal, sin observaciones" },
        { id: "v7", ocurrido_en: hace(2), estado: "en_transito", ubicacion: "Madrid, ES", descripcion: "Escala técnica, cadena de frío estable" },
        { id: "v8", ocurrido_en: hace(4), estado: "en_transito", ubicacion: "SJO Aeropuerto", descripcion: "Documentos CITES y fitosanitario emitidos" },
        { id: "v9", ocurrido_en: hace(5), estado: "preparando", ubicacion: "San Rafael de Alajuela, CR", descripcion: "120 pupas empacadas con gel refrigerante" },
        { id: "v10", ocurrido_en: hace(6), estado: "preparando", ubicacion: "San Rafael de Alajuela, CR", descripcion: "Pedido confirmado, iniciando selección" },
      ],
    },
  },
  {
    id: "d3", codigo: "MAR-01003", estado: "preparando", total: 516.0, moneda: "USD",
    notas: "Pedido para taller escolar", creado_en: hace(2),
    items: [
      { id: "i7", cantidad: 60, precio_unitario: 3.8, especie: esp(4) },
      { id: "i8", cantidad: 30, precio_unitario: 6.1, especie: esp(7) },
      { id: "i9", cantidad: 25, precio_unitario: 4.2, especie: esp(2) },
    ],
    envio: {
      id: "s3", transportista: "Por asignar", numero_guia: null, url_rastreo: null,
      estado: "preparando", origen: "San Rafael de Alajuela, CR", destino: "Bogotá, CO",
      enviado_en: null, entrega_estimada: enDias(8), entregado_en: null, temperatura_c: 15.0,
      eventos: [
        { id: "v11", ocurrido_en: hace(0.25), estado: "preparando", ubicacion: "San Rafael de Alajuela, CR", descripcion: "Pupas recibidas del criadero, 115 de 115 sanas" },
        { id: "v12", ocurrido_en: hace(2), estado: "preparando", ubicacion: "San Rafael de Alajuela, CR", descripcion: "Pedido recibido, coordinando el acopio" },
      ],
    },
  },
  {
    id: "d4", codigo: "MAR-01004", estado: "pendiente", total: 340.0, moneda: "USD",
    notas: "Cotización aprobada, a la espera del anticipo", creado_en: hace(0.4),
    items: [{ id: "i10", cantidad: 40, precio_unitario: 8.5, especie: esp(0) }],
    envio: null,
  },
];

/** Total global de mariposas vendidas que se muestra en el sitio público. */
export const totalMariposasDemo = 38420;
