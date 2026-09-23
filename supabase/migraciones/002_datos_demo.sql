-- ============================================================================
--  Mariposas — datos de demostración (catálogo + impacto social)
--  Correlo DESPUÉS de 001_esquema.sql. También es idempotente.
--  Estos datos son públicos: no dependen de ningún usuario.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Catálogo de especies
-- ---------------------------------------------------------------------------
insert into especies (nombre_comun, nombre_cientifico, familia, region, precio_unitario, descripcion, emoji) values
  ('Morpho azul',        'Morpho peleides',      'Nymphalidae', 'Costa Rica',  8.50, 'El clásico azul metálico. Alta demanda en exhibiciones y eventos.', '🦋'),
  ('Búho gigante',       'Caligo memnon',        'Nymphalidae', 'Costa Rica',  6.75, 'Enormes ocelos que imitan ojos de búho. Muy resistente al transporte.', '🦉'),
  ('Monarca',            'Danaus plexippus',     'Nymphalidae', 'Mesoamérica', 4.20, 'Icono de la migración. Ideal para programas educativos.', '🧡'),
  ('Alas de cristal',    'Greta oto',            'Nymphalidae', 'Costa Rica',  9.90, 'Alas transparentes. La favorita de los fotógrafos.', '💎'),
  ('Cebra de alas largas','Heliconius charithonia','Nymphalidae','Centroamérica',3.80,'Vuelo lento y llamativo. Excelente para mariposarios abiertos.', '🖤'),
  ('Cola de golondrina', 'Papilio thoas',        'Papilionidae','Costa Rica',   7.40, 'Amarillo intenso con colas pronunciadas.', '💛'),
  ('Malaquita',          'Siproeta stelenes',    'Nymphalidae', 'Costa Rica',  5.60, 'Verde jade translúcido. Muy longeva en cautiverio.', '💚'),
  ('Ochenta y ocho',     'Diaethria astala',     'Nymphalidae', 'Costa Rica',  6.10, 'El "88" dibujado en las alas inferiores.', '🔢')
on conflict (nombre_cientifico) do update set
  nombre_comun    = excluded.nombre_comun,
  familia         = excluded.familia,
  region          = excluded.region,
  precio_unitario = excluded.precio_unitario,
  descripcion     = excluded.descripcion,
  emoji           = excluded.emoji;

-- ---------------------------------------------------------------------------
-- Proyectos sociales: en qué se convierte cada venta
-- ---------------------------------------------------------------------------
insert into proyectos_sociales (slug, nombre, descripcion, unidad, emoji, meta_anual, orden) values
  ('semillas-manzano',  'Semillas de manzano sembradas',
   'Compramos y sembramos semillas de manzano con familias de la zona alta para diversificar sus cultivos.',
   'semillas', '🍎', 12000, 1),
  ('arboles-nativos',   'Árboles nativos plantados',
   'Reforestación con especies hospederas de mariposas: madero negro, guarumo, pasiflora.',
   'árboles', '🌳', 2500, 2),
  ('metros-conservados','Bosque en conservación',
   'Metros cuadrados de bosque bajo acuerdo de no tala financiados con las ventas.',
   'm²', '🌿', 80000, 3),
  ('horas-empleo',      'Horas de empleo rural',
   'Horas pagadas a las familias criadoras que nos abastecen, la mayoría encabezadas por mujeres.',
   'horas', '🧑‍🌾', 9000, 4),
  ('talleres-escolares','Talleres escolares de ecología',
   'Talleres gratuitos en escuelas rurales sobre polinizadores y ciclo de vida.',
   'talleres', '🎓', 60, 5)
on conflict (slug) do update set
  nombre      = excluded.nombre,
  descripcion = excluded.descripcion,
  unidad      = excluded.unidad,
  emoji       = excluded.emoji,
  meta_anual  = excluded.meta_anual,
  orden       = excluded.orden;

-- ---------------------------------------------------------------------------
-- Reglas de conversión: "cada N mariposas vendidas => X unidades"
-- Ajustá estos números y todo el dashboard se recalcula solo.
-- ---------------------------------------------------------------------------
delete from reglas_impacto;
insert into reglas_impacto (proyecto_id, mariposas_por_bloque, unidades_por_bloque)
select id, v.bloque, v.unidades
from proyectos_sociales ps
join (values
  ('semillas-manzano',   1,  3.0),   -- 1 mariposa  = 3 semillas
  ('arboles-nativos',   25,  1.0),   -- 25 mariposas = 1 árbol
  ('metros-conservados', 5, 10.0),   -- 5 mariposas  = 10 m2
  ('horas-empleo',       4,  1.0),   -- 4 mariposas  = 1 hora de empleo
  ('talleres-escolares',500, 1.0)    -- 500 mariposas = 1 taller
) as v(slug, bloque, unidades) on v.slug = ps.slug;

-- ---------------------------------------------------------------------------
-- Impacto ya ejecutado (evidencia real que se muestra en /impacto)
-- ---------------------------------------------------------------------------
delete from impacto_registros;
insert into impacto_registros (proyecto_id, cantidad, fecha, detalle)
select ps.id, v.cantidad, v.fecha::date, v.detalle
from proyectos_sociales ps
join (values
  ('semillas-manzano',  4200, '2026-02-10', 'Entrega a 14 familias de Cerro Alto'),
  ('semillas-manzano',  2600, '2026-05-18', 'Segunda entrega + capacitación de injerto'),
  ('semillas-manzano',  1850, '2026-08-02', 'Vivero comunitario de La Cima'),
  ('arboles-nativos',    620, '2026-03-22', 'Jornada de reforestación Día del Agua'),
  ('arboles-nativos',    410, '2026-07-05', 'Corredor biológico quebrada Los Ángeles'),
  ('metros-conservados',28000,'2026-01-15', 'Acuerdo de conservación finca San Isidro'),
  ('metros-conservados',16500,'2026-06-30', 'Ampliación del acuerdo, sector norte'),
  ('horas-empleo',      3100, '2026-04-30', 'Primer cuatrimestre: 9 familias criadoras'),
  ('horas-empleo',      2740, '2026-08-31', 'Segundo cuatrimestre: 11 familias criadoras'),
  ('talleres-escolares',   18,'2026-05-30', 'Escuelas de San Rafael y Río Segundo'),
  ('talleres-escolares',   11,'2026-08-20', 'Circuito escolar de Sarapiquí')
) as v(slug, cantidad, fecha, detalle) on v.slug = ps.slug;
