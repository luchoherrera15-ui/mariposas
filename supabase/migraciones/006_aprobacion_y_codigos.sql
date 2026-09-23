-- ============================================================================
--  Aprobación de cuentas + ingreso con código por correo
--  Correlo después de 005 (en el schema "mariposas"). Es idempotente.
--
--  - Toda cuenta nueva nace sin aprobar: ve su panel, pero no pedidos,
--    envíos ni precios hasta que un admin la aprueba en /admin/clientes.
--  - Esto se cumple en la base (RLS), no solo en pantalla.
-- ============================================================================

set search_path = mariposas, public, extensions;

-- ---------------------------------------------------------------------------
-- 1. Perfiles: estado de aprobación
-- ---------------------------------------------------------------------------
alter table perfiles add column if not exists aprobado    boolean not null default false;
alter table perfiles add column if not exists aprobado_en timestamptz;

-- Los administradores quedan aprobados.
update perfiles set aprobado = true, aprobado_en = coalesce(aprobado_en, now())
where rol = 'admin' and not aprobado;

-- ¿La cuenta que hace la consulta está aprobada? SECURITY DEFINER para que
-- las políticas de abajo puedan leer perfiles sin depender de su propio RLS.
create or replace function cuenta_aprobada()
returns boolean
language sql
security definer set search_path = mariposas
stable
as $funcion$
  select coalesce((select aprobado from perfiles where id = auth.uid()), false);
$funcion$;

grant execute on function cuenta_aprobada() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Pedidos y envíos: solo cuentas aprobadas ven lo suyo
-- ---------------------------------------------------------------------------
drop policy if exists "pedidos propios" on pedidos;
create policy "pedidos propios" on pedidos for select using (
  auth.uid() = cliente_id and cuenta_aprobada()
);

drop policy if exists "items de pedidos propios" on pedido_items;
create policy "items de pedidos propios" on pedido_items for select using (
  cuenta_aprobada() and exists (
    select 1 from pedidos p where p.id = pedido_items.pedido_id and p.cliente_id = auth.uid()
  )
);

drop policy if exists "envios propios" on envios;
create policy "envios propios" on envios for select using (
  cuenta_aprobada() and exists (
    select 1 from pedidos p where p.id = envios.pedido_id and p.cliente_id = auth.uid()
  )
);

drop policy if exists "eventos de envios propios" on envio_eventos;
create policy "eventos de envios propios" on envio_eventos for select using (
  cuenta_aprobada() and exists (
    select 1 from envios e
    join pedidos p on p.id = e.pedido_id
    where e.id = envio_eventos.envio_id and p.cliente_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- 3. Precios fuera de la API pública
--    El catálogo sigue siendo público, pero sin la columna precio_unitario.
--    Los precios solo se leen desde el servidor (service_role).
-- ---------------------------------------------------------------------------
revoke select on especies from anon, authenticated;
grant select (id, nombre_comun, nombre_cientifico, familia, region, descripcion,
              emoji, imagen_url, activo, creado_en)
  on especies to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Registro de códigos enviados (límite anti-abuso por correo)
--    Sin políticas: solo lo usa el servidor con service_role.
-- ---------------------------------------------------------------------------
create table if not exists codigos_enviados (
  id         bigint generated always as identity primary key,
  email      text not null,
  enviado_en timestamptz not null default now()
);
create index if not exists codigos_enviados_email_idx on codigos_enviados (email, enviado_en desc);
alter table codigos_enviados enable row level security;

grant all on codigos_enviados to service_role;
grant all on all sequences in schema mariposas to service_role;
grant all on all functions in schema mariposas to service_role;

notify pgrst, 'reload schema';
