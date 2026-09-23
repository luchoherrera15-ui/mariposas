-- ============================================================================
--  Listado de clientes para /admin/clientes.
--  auth.users se comparte con otras apps: el listado sale de "perfiles" (solo
--  quien entró alguna vez a mariposas) y toma el correo de auth.users.
--  Solo lo puede ejecutar service_role (el servidor del panel admin).
-- ============================================================================

set search_path = mariposas, public, extensions;

create or replace function clientes_admin()
returns table (
  id          uuid,
  email       text,
  nombre      text,
  empresa     text,
  rol         text,
  aprobado    boolean,
  aprobado_en timestamptz,
  creado_en   timestamptz
)
language sql
security definer set search_path = mariposas
stable
as $funcion$
  select p.id, u.email::text, p.nombre, p.empresa, p.rol, p.aprobado, p.aprobado_en, p.creado_en
  from perfiles p
  join auth.users u on u.id = p.id
  order by p.aprobado, p.creado_en desc;
$funcion$;

revoke execute on function clientes_admin() from public, anon, authenticated;
grant execute on function clientes_admin() to service_role;

notify pgrst, 'reload schema';
