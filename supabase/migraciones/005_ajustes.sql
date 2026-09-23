-- ============================================================================
--  Ajustes del sitio: todo lo que hoy estaría "quemado" en el código y que
--  debe poder cambiarse desde /admin/ajustes sin tocar el proyecto.
--  Correlo después de 004. Es idempotente.
-- ============================================================================

create table if not exists ajustes (
  clave          text primary key,
  valor          text not null default '',
  etiqueta       text not null,
  ayuda          text,
  grupo          text not null default 'general',
  multilinea     boolean not null default false,
  orden          integer not null default 0,
  actualizado_en timestamptz not null default now()
);

alter table ajustes enable row level security;

drop policy if exists "ajustes publicos" on ajustes;
create policy "ajustes publicos" on ajustes for select using (true);
-- Sin políticas de escritura: solo se escribe con service_role desde /admin.

grant select on ajustes to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Valores iniciales. `do update` solo repone la etiqueta y la ayuda: si ya
-- editaste un valor desde el panel, no se pisa.
-- ---------------------------------------------------------------------------
insert into ajustes (clave, valor, etiqueta, ayuda, grupo, multilinea, orden) values
  ('marca_nombre', 'Tropical Butterfly Exports', 'Nombre de la empresa',
   'Aparece en el encabezado, el pie y el título de las pestañas.', 'Empresa', false, 1),
  ('marca_descripcion', 'Comercialización y exportación de mariposas tropicales vivas desde Costa Rica, con impacto social medible.',
   'Descripción corta', 'Se usa en buscadores y redes sociales.', 'Empresa', true, 2),
  ('marca_correo', 'ventas@tropicalbutterflyexports.com', 'Correo de ventas', null, 'Empresa', false, 3),
  ('marca_telefono', '+506 8888 8888', 'Teléfono', null, 'Empresa', false, 4),
  ('marca_ubicacion', 'San Rafael de Alajuela, Costa Rica', 'Ubicación', null, 'Empresa', false, 5),
  ('marca_pie', 'Comercializadora y exportadora de mariposas tropicales vivas. San Rafael de Alajuela, Costa Rica.',
   'Texto del pie de página', null, 'Empresa', true, 6),

  ('inicio_titular', 'Salen en pupa de Costa Rica y abren en tu mariposario.', 'Titular de la portada',
   'El texto grande sobre la foto.', 'Portada', true, 1),
  ('inicio_entradilla', 'Comercializamos ocho especies tropicales y las exportamos vivas a mariposarios, museos y centros de ciencia. Trabajamos con criaderos costarricenses, con cadena de frío registrada de punta a punta y reposición de toda pupa que no abra.',
   'Párrafo de la portada', null, 'Portada', true, 2),

  ('cifra1_valor', '38 420', 'Cifra 1: número', null, 'Cifras de la portada', false, 1),
  ('cifra1_texto', 'mariposas exportadas desde 2019', 'Cifra 1: descripción', null, 'Cifras de la portada', false, 2),
  ('cifra2_valor', '97,4 %', 'Cifra 2: número', null, 'Cifras de la portada', false, 3),
  ('cifra2_texto', 'abren sanas al llegar a destino', 'Cifra 2: descripción', null, 'Cifras de la portada', false, 4),
  ('cifra3_valor', '11', 'Cifra 3: número', null, 'Cifras de la portada', false, 5),
  ('cifra3_texto', 'países con envíos recurrentes', 'Cifra 3: descripción', null, 'Cifras de la portada', false, 6),

  ('ciclo_titulo', 'Nueve días desde que cerrás el pedido', 'Título del ciclo de entrega', null, 'Ciclo de entrega', false, 1),
  ('ciclo_texto', 'La pupa aguanta entre diez y catorce días antes de abrir. Todo el proceso está calzado para que llegue con margen, no justo.',
   'Párrafo del ciclo', null, 'Ciclo de entrega', true, 2),
  ('ciclo_pasos', E'0|Confirmación|Cerramos especies, cantidades y fecha de vuelo.\n3|Acopio y selección|Recibimos de los criaderos y descartamos toda pupa dudosa.\n5|Empaque en frío|Algodón, gel refrigerante y registrador de temperatura.\n9|Entrega|Aduana, inspección fitosanitaria y puerta del mariposario.',
   'Pasos del ciclo', 'Una línea por paso, con el formato: día|título|descripción', 'Ciclo de entrega', true, 3),

  ('envio_condiciones', E'Mínimo por especie|25 pupas\nTemperatura de tránsito|13 °C a 16 °C\nDocumentos incluidos|Permiso CITES y certificado fitosanitario\nPupas no viables|Se reponen sin costo en el siguiente envío',
   'Condiciones de envío', 'Una línea por condición, con el formato: etiqueta|valor', 'Envíos', true, 1),
  ('envio_texto', 'Se exportan en fase de pupa, que es cuando el insecto aguanta el traslado. Van en bandejas de algodón con gel refrigerante y un registrador de temperatura que se lee al abrir la caja.',
   'Párrafo de "Cómo viajan"', null, 'Envíos', true, 2)
on conflict (clave) do update set
  etiqueta   = excluded.etiqueta,
  ayuda      = excluded.ayuda,
  grupo      = excluded.grupo,
  multilinea = excluded.multilinea,
  orden      = excluded.orden;
