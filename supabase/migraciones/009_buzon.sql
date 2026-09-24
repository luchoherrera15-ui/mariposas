-- ============================================================================
--  Buzón de correo del panel (/admin/correo).
--  Los correos que llegan a info@ los manda el Email Worker de Cloudflare a
--  /api/correo/entrante; los que se envían salen por Resend. Todo se guarda
--  acá. Solo el servidor (service_role) lee y escribe: sin políticas RLS.
-- ============================================================================

set search_path = mariposas, public, extensions;

create table if not exists correos (
  id              uuid primary key default gen_random_uuid(),
  hilo_id         uuid,
  direccion       text not null check (direccion in ('entrante', 'saliente')),
  de_email        text not null,
  de_nombre       text,
  para            text[] not null default '{}',
  cc              text[] not null default '{}',
  asunto          text not null default '',
  texto           text,
  html            text,
  message_id      text,
  en_respuesta_a  text,
  referencias     text[] not null default '{}',
  adjuntos        jsonb not null default '[]',
  leido           boolean not null default false,
  archivado       boolean not null default false,
  resend_id       text,
  enviado_por     uuid references auth.users(id) on delete set null,
  creado_en       timestamptz not null default now()
);

create index if not exists correos_hilo_idx      on correos (hilo_id, creado_en);
create index if not exists correos_bandeja_idx   on correos (direccion, archivado, creado_en desc);
create unique index if not exists correos_message_id_idx on correos (message_id) where message_id is not null;

alter table correos enable row level security;

revoke all on correos from anon, authenticated;
grant all on correos to service_role;

notify pgrst, 'reload schema';
