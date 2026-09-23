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
  ) then
    alter table perfiles
      add constraint perfiles_rol_valido check (rol in ('cliente', 'admin'));
  end if;
end
$bloque$;

-- ---------------------------------------------------------------------------
--  >>> PROMOVETE A ADMINISTRADOR <<<
--  Cambiá el correo por el tuyo y corré estas dos líneas.
--  Sin esto, /admin te va a rechazar.
-- ---------------------------------------------------------------------------
update perfiles set rol = 'admin'
where id = (select id from auth.users where lower(email) = lower('CAMBIA_ESTO@correo.com'));

-- Para ver quién es administrador:
--   select p.rol, u.email from perfiles p join auth.users u on u.id = p.id;
