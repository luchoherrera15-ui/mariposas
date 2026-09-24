-- ============================================================================
--  Cotizaciones: el cliente arma una solicitud desde el catálogo, el admin le
--  pone precio, el cliente la acepta y pasa a ser un pedido.
--
--  Estados de "pedidos", en orden:
--    solicitado → cotizado → pendiente (aceptada) → confirmado → preparando
--    → enviado → entregado.   Laterales: rechazado (el cliente dijo que no),
--    cancelado.
--  Es idempotente.
-- ============================================================================

set search_path = mariposas, public, extensions;

alter table pedidos drop constraint if exists pedidos_estado_check;
alter table pedidos add constraint pedidos_estado_check check (estado in (
  'solicitado', 'cotizado', 'rechazado',
  'pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'
));

-- Lo que pide el cliente y lo que responde la empresa.
alter table pedidos add column if not exists destino_pais    text;
alter table pedidos add column if not exists fecha_deseada   date;
alter table pedidos add column if not exists mensaje_cliente text;
alter table pedidos add column if not exists respuesta       text;           -- nota de la empresa para el cliente
alter table pedidos add column if not exists flete           numeric(12,2) not null default 0;
alter table pedidos add column if not exists valida_hasta    date;
alter table pedidos add column if not exists idioma          text not null default 'en';
alter table pedidos add column if not exists cotizado_en     timestamptz;
alter table pedidos add column if not exists respondido_en   timestamptz;    -- aceptó o rechazó
alter table pedidos add column if not exists confirmado_en   timestamptz;

-- Idioma preferido del cliente (para los correos que le mandamos).
alter table perfiles add column if not exists idioma text not null default 'en';

-- ---------------------------------------------------------------------------
-- Visibilidad: la cuenta sin aprobar igual ve SUS solicitudes (sin precio).
-- Enviar una cotización aprueba la cuenta, así que de ahí en adelante ve todo.
-- ---------------------------------------------------------------------------
create or replace function pedido_visible(p_cliente uuid, p_estado text)
returns boolean
language sql
stable
security definer set search_path = mariposas
as $funcion$
  select p_cliente = auth.uid() and (cuenta_aprobada() or p_estado = 'solicitado');
$funcion$;
grant execute on function pedido_visible(uuid, text) to authenticated;

drop policy if exists "pedidos propios" on pedidos;
create policy "pedidos propios" on pedidos for select using (pedido_visible(cliente_id, estado));

drop policy if exists "items de pedidos propios" on pedido_items;
create policy "items de pedidos propios" on pedido_items for select using (
  exists (select 1 from pedidos p where p.id = pedido_items.pedido_id and pedido_visible(p.cliente_id, p.estado))
);

-- Envíos y eventos siguen exigiendo cuenta aprobada (no hay envío sin pedido confirmado).

-- ---------------------------------------------------------------------------
-- El total público de mariposas vendidas cuenta solo pedidos reales.
-- ---------------------------------------------------------------------------
create or replace function total_mariposas_vendidas()
returns bigint
language sql
security definer set search_path = mariposas
stable
as $funcion$
  select coalesce(sum(i.cantidad), 0)::bigint
  from pedido_items i
  join pedidos p on p.id = i.pedido_id
  where p.estado in ('pendiente', 'confirmado', 'preparando', 'enviado', 'entregado');
$funcion$;

notify pgrst, 'reload schema';
