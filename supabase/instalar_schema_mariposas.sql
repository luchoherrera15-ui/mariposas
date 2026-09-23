-- ============================================================================
--  Mariposas — instalación completa dentro de un proyecto de Supabase COMPARTIDO
--
--  Crea el schema "mariposas" y mete ahí todas las tablas, vistas y funciones,
--  sin tocar las de tu otra app (que viven en "public").
--  Pegá TODO este archivo en Supabase → SQL Editor → Run. Es idempotente.
--
--  Generado a partir de migraciones/001, 002, 004 y 005.
-- ============================================================================

create schema if not exists mariposas;

-- Todo lo que sigue se crea dentro de "mariposas".
set search_path = mariposas, public, extensions;

-- ============================================================================
--  Mariposas — esquema base
--  Pegá TODO este archivo en Supabase → SQL Editor → Run.
--  Es idempotente: podés volver a correrlo sin romper nada.
--
--  NOTA: usa nombres de tabla "limpios" (especies, pedidos, envios...) porque
--  asume un proyecto de Supabase dedicado a este sitio. Si compartís el
--  proyecto con otra app, avisá y les pongo prefijo (mariposas_*).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Perfiles: extiende auth.users con datos del cliente
-- ---------------------------------------------------------------------------
create table if not exists perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text,
  empresa    text,
  pais       text,
  telefono   text,
  creado_en  timestamptz not null default now()
);

-- Al registrarse un usuario se le crea el perfil automáticamente.
create or replace function crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer set search_path = mariposas
as $funcion$
begin
  -- auth.users es compartido con la otra app: solo se crea perfil a los
  -- usuarios que se registraron desde el sitio de mariposas.
  if coalesce(new.raw_user_meta_data->>'app', '') <> 'mariposas' then
    return new;
  end if;

  insert into perfiles (id, nombre, empresa)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'empresa'
  )
  on conflict (id) do nothing;
  return new;
end;
$funcion$;

drop trigger if exists mariposas_al_crear_usuario on auth.users;
create trigger mariposas_al_crear_usuario
  after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();

-- ---------------------------------------------------------------------------
-- 2. Catálogo de especies
-- ---------------------------------------------------------------------------
create table if not exists especies (
  id                 uuid primary key default gen_random_uuid(),
  nombre_comun       text not null,
  nombre_cientifico  text not null unique,
  familia            text,
  region             text,
  precio_unitario    numeric(10,2) not null default 0,
  descripcion        text,
  emoji              text,          -- placeholder visual mientras no hay fotos
  imagen_url         text,
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Pedidos
-- ---------------------------------------------------------------------------
create sequence if not exists pedidos_codigo_seq start 1001;

create table if not exists pedidos (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null unique default 'MAR-' || lpad(nextval('pedidos_codigo_seq')::text, 5, '0'),
  cliente_id uuid not null references auth.users(id) on delete cascade,
  estado     text not null default 'pendiente'
             check (estado in ('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
  total      numeric(12,2) not null default 0,
  moneda     text not null default 'USD',
  notas      text,
  creado_en  timestamptz not null default now()
);
create index if not exists pedidos_cliente_idx on pedidos (cliente_id, creado_en desc);

create table if not exists pedido_items (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references pedidos(id) on delete cascade,
  especie_id      uuid not null references especies(id),
  cantidad        integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null default 0
);
create index if not exists pedido_items_pedido_idx on pedido_items (pedido_id);

-- ---------------------------------------------------------------------------
-- 4. Envíos y tracking
-- ---------------------------------------------------------------------------
create table if not exists envios (
  id                uuid primary key default gen_random_uuid(),
  pedido_id         uuid not null unique references pedidos(id) on delete cascade,
  transportista     text,
  numero_guia       text,
  url_rastreo       text,
  estado            text not null default 'preparando'
                    check (estado in ('preparando','en_transito','en_aduana','en_reparto','entregado','incidencia')),
  origen            text,
  destino           text,
  enviado_en        timestamptz,
  entrega_estimada  date,
  entregado_en      timestamptz,
  temperatura_c     numeric(4,1),   -- las pupas vivas viajan en frío controlado
  creado_en         timestamptz not null default now()
);

create table if not exists envio_eventos (
  id          uuid primary key default gen_random_uuid(),
  envio_id    uuid not null references envios(id) on delete cascade,
  ocurrido_en timestamptz not null default now(),
  estado      text not null,
  ubicacion   text,
  descripcion text
);
create index if not exists envio_eventos_envio_idx on envio_eventos (envio_id, ocurrido_en desc);

-- ---------------------------------------------------------------------------
-- 5. Impacto social
--    proyectos_sociales = en qué invertimos
--    reglas_impacto     = la regla "cada N mariposas -> X unidades"
--    impacto_registros  = lo realmente ejecutado (evidencia)
-- ---------------------------------------------------------------------------
create table if not exists proyectos_sociales (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  nombre      text not null,
  descripcion text,
  unidad      text not null,        -- 'semillas', 'árboles', 'horas', 'm2'...
  emoji       text,
  meta_anual  numeric(12,2),
  activo      boolean not null default true,
  orden       integer not null default 0
);

create table if not exists reglas_impacto (
  id                   uuid primary key default gen_random_uuid(),
  proyecto_id          uuid not null references proyectos_sociales(id) on delete cascade,
  mariposas_por_bloque integer not null check (mariposas_por_bloque > 0),
  unidades_por_bloque  numeric(10,2) not null default 1,
  activo               boolean not null default true
);

create table if not exists impacto_registros (
  id            uuid primary key default gen_random_uuid(),
  proyecto_id   uuid not null references proyectos_sociales(id) on delete cascade,
  cantidad      numeric(12,2) not null,
  fecha         date not null default current_date,
  detalle       text,
  evidencia_url text,
  creado_en     timestamptz not null default now()
);
create index if not exists impacto_registros_proyecto_idx on impacto_registros (proyecto_id, fecha desc);

-- ---------------------------------------------------------------------------
-- 6. Vistas de lectura
-- ---------------------------------------------------------------------------

-- Pedido + total de mariposas. security_invoker => respeta el RLS del usuario.
drop view if exists vista_pedidos;
create view vista_pedidos with (security_invoker = true) as
select p.id, p.codigo, p.cliente_id, p.estado, p.total, p.moneda, p.notas, p.creado_en,
       coalesce(sum(i.cantidad), 0)::int as mariposas
from pedidos p
left join pedido_items i on i.pedido_id = p.id
group by p.id;

-- Impacto global ejecutado por proyecto (público).
drop view if exists vista_impacto_global;
create view vista_impacto_global with (security_invoker = true) as
select ps.id, ps.slug, ps.nombre, ps.descripcion, ps.unidad, ps.emoji,
       ps.meta_anual, ps.orden,
       coalesce(sum(ir.cantidad), 0) as ejecutado
from proyectos_sociales ps
left join impacto_registros ir on ir.proyecto_id = ps.id
where ps.activo
group by ps.id;

-- Total global de mariposas vendidas. Necesita SECURITY DEFINER porque el RLS
-- de `pedidos` solo deja ver los pedidos propios, y este número es público.
create or replace function total_mariposas_vendidas()
returns bigint
language sql
security definer set search_path = mariposas
stable
as $funcion$
  select coalesce(sum(i.cantidad), 0)::bigint
  from pedido_items i
  join pedidos p on p.id = i.pedido_id
  where p.estado <> 'cancelado';
$funcion$;

-- ---------------------------------------------------------------------------
-- 7. RLS (Row Level Security)
--    Lectura pública: catálogo e impacto.
--    Lectura privada: cada cliente ve SOLO lo suyo.
--    Escritura: ninguna política => solo se escribe con la service_role key
--    desde el servidor (o desde el panel de Supabase). Así el demo es seguro.
-- ---------------------------------------------------------------------------
alter table perfiles            enable row level security;
alter table especies            enable row level security;
alter table pedidos             enable row level security;
alter table pedido_items        enable row level security;
alter table envios              enable row level security;
alter table envio_eventos       enable row level security;
alter table proyectos_sociales  enable row level security;
alter table reglas_impacto      enable row level security;
alter table impacto_registros   enable row level security;

drop policy if exists "perfil propio: leer"   on perfiles;
drop policy if exists "perfil propio: crear"  on perfiles;
drop policy if exists "perfil propio: editar" on perfiles;
create policy "perfil propio: leer"   on perfiles for select using (auth.uid() = id);
create policy "perfil propio: crear"  on perfiles for insert with check (auth.uid() = id);
create policy "perfil propio: editar" on perfiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "catalogo publico" on especies;
create policy "catalogo publico" on especies for select using (true);

drop policy if exists "pedidos propios" on pedidos;
create policy "pedidos propios" on pedidos for select using (auth.uid() = cliente_id);

drop policy if exists "items de pedidos propios" on pedido_items;
create policy "items de pedidos propios" on pedido_items for select using (
  exists (select 1 from pedidos p where p.id = pedido_items.pedido_id and p.cliente_id = auth.uid())
);

drop policy if exists "envios propios" on envios;
create policy "envios propios" on envios for select using (
  exists (select 1 from pedidos p where p.id = envios.pedido_id and p.cliente_id = auth.uid())
);

drop policy if exists "eventos de envios propios" on envio_eventos;
create policy "eventos de envios propios" on envio_eventos for select using (
  exists (
    select 1 from envios e
    join pedidos p on p.id = e.pedido_id
    where e.id = envio_eventos.envio_id and p.cliente_id = auth.uid()
  )
);

drop policy if exists "proyectos publicos" on proyectos_sociales;
create policy "proyectos publicos" on proyectos_sociales for select using (true);

drop policy if exists "reglas publicas" on reglas_impacto;
create policy "reglas publicas" on reglas_impacto for select using (true);

drop policy if exists "impacto publico" on impacto_registros;
create policy "impacto publico" on impacto_registros for select using (true);

-- ---------------------------------------------------------------------------
-- 8. Permisos
-- ---------------------------------------------------------------------------
grant select on especies, proyectos_sociales, reglas_impacto, impacto_registros,
                vista_impacto_global to anon, authenticated;
grant select on perfiles, pedidos, pedido_items, envios, envio_eventos,
                vista_pedidos to authenticated;
grant execute on function total_mariposas_vendidas() to anon, authenticated;

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

-- ============================================================================
--  Panel administrativo — rol de usuario
--  Correlo después de 001. Es idempotente.
-- ============================================================================

alter table perfiles
  add column if not exists rol text not null default 'cliente';

do $bloque$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'perfiles_rol_valido'
      and connamespace = 'mariposas'::regnamespace
  ) then
    alter table perfiles
      add constraint perfiles_rol_valido check (rol in ('cliente', 'admin'));
  end if;
end
$bloque$;

-- ---------------------------------------------------------------------------

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

-- ============================================================================
--  Permisos sobre el schema nuevo. En "public" Supabase los da solo; en un
--  schema propio hay que darlos a mano o la API responde "permission denied".
-- ============================================================================
grant usage on schema mariposas to anon, authenticated, service_role;
grant all on all tables    in schema mariposas to service_role;
grant all on all sequences in schema mariposas to service_role;
grant all on all functions in schema mariposas to service_role;
grant usage on all sequences in schema mariposas to authenticated;

-- Refresca la caché de la API para que vea las tablas nuevas.
notify pgrst, 'reload schema';
