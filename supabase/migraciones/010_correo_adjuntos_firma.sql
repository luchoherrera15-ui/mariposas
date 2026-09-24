-- ============================================================================
--  Editor de correo: adjuntos y firma.
--  - Bucket privado "mariposas-correo": adjuntos que se envían (salientes/) y
--    los que llegan (entrantes/). Sin políticas: el navegador sube con una URL
--    firmada que genera el servidor, y solo el servidor lee.
--  - Firma de cada administrador, en HTML.
-- ============================================================================

set search_path = mariposas, public, extensions;

insert into storage.buckets (id, name, public, file_size_limit)
values ('mariposas-correo', 'mariposas-correo', false, 26214400)  -- 25 MB por archivo
on conflict (id) do nothing;

create table if not exists firmas (
  usuario_id     uuid primary key references auth.users(id) on delete cascade,
  html           text not null default '',
  actualizado_en timestamptz not null default now()
);

alter table firmas enable row level security;
revoke all on firmas from anon, authenticated;
grant all on firmas to service_role;

notify pgrst, 'reload schema';
