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
security definer set search_path = public
as $funcion$
begin
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

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
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
security definer set search_path = public
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
