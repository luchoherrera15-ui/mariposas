-- ============================================================================
--  Solicitudes de visita (/visitas → /admin/visitas).
--  Las escribe el servidor con service_role; no hay políticas RLS.
-- ============================================================================

set search_path = mariposas, public, extensions;

create table if not exists solicitudes_visita (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  empresa     text,
  email       text not null,
  pais        text not null,
  fechas      text,
  personas    integer check (personas is null or personas between 1 and 99),
  intereses   text[] not null default '{}',
  mensaje     text,
  idioma      text not null default 'en',
  usuario_id  uuid references auth.users(id) on delete set null,
  estado      text not null default 'nueva'
              check (estado in ('nueva', 'en_contacto', 'confirmada', 'cerrada')),
  notas       text,                       -- notas internas del equipo
  creado_en   timestamptz not null default now()
);
create index if not exists solicitudes_visita_estado_idx on solicitudes_visita (estado, creado_en desc);
create index if not exists solicitudes_visita_email_idx on solicitudes_visita (email, creado_en desc);

alter table solicitudes_visita enable row level security;
revoke all on solicitudes_visita from anon, authenticated;
grant all on solicitudes_visita to service_role;

notify pgrst, 'reload schema';
