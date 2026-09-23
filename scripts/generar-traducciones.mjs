// Genera supabase/migraciones/007_traducciones.sql a partir de
// supabase/traducciones/{en,it,fr,zh}.json. Correr con: node scripts/generar-traducciones.mjs
import fs from "node:fs";

const IDIOMAS = ["en", "it", "fr", "zh"];
const datos = Object.fromEntries(
  IDIOMAS.map((l) => [l, JSON.parse(fs.readFileSync(`supabase/traducciones/${l}.json`, "utf8"))]),
);

const lit = (texto) => `'${String(texto).replaceAll("'", "''")}'`;
const json = (valor) => `${lit(JSON.stringify(valor))}::jsonb`;

/** { en: {...}, it: {...} } para una fila, tomando `seccion[clave]` de cada idioma. */
function porIdioma(seccion, clave, transformar = (x) => x) {
  const salida = {};
  for (const l of IDIOMAS) {
    const valor = datos[l][seccion]?.[clave];
    if (valor === undefined) throw new Error(`Falta ${l}.${seccion}.${clave}`);
    salida[l] = transformar(valor);
  }
  return salida;
}

const claves = (seccion) => Object.keys(datos.en[seccion]);
const lineas = [];
const sql = (s) => lineas.push(s);

sql(`-- ============================================================================
--  Traducciones del contenido editable (en, it, fr, zh). El español sigue en
--  las columnas de siempre; el resto va en "traducciones" jsonb.
--  GENERADO por scripts/generar-traducciones.mjs — no editar a mano.
--  Idempotente: correrlo otra vez repone las traducciones de fábrica.
-- ============================================================================

set search_path = mariposas, public, extensions;

alter table especies           add column if not exists traducciones jsonb not null default '{}'::jsonb;
alter table proyectos_sociales add column if not exists traducciones jsonb not null default '{}'::jsonb;
alter table proyectos_sociales add column if not exists unidad_singular text;
alter table impacto_registros  add column if not exists traducciones jsonb not null default '{}'::jsonb;
alter table ajustes            add column if not exists traducciones jsonb not null default '{}'::jsonb;

-- La vista pública del impacto tiene que exponer las columnas nuevas.
drop view if exists vista_impacto_global;
create view vista_impacto_global with (security_invoker = true) as
select ps.id, ps.slug, ps.nombre, ps.descripcion, ps.unidad, ps.unidad_singular, ps.emoji,
       ps.meta_anual, ps.orden, ps.traducciones,
       coalesce(sum(ir.cantidad), 0) as ejecutado
from proyectos_sociales ps
left join impacto_registros ir on ir.proyecto_id = ps.id
where ps.activo
group by ps.id;
grant select on vista_impacto_global to anon, authenticated;

-- especies usa permisos por columna (el precio no es público): sumar la nueva.
grant select (traducciones) on especies to anon, authenticated;

-- Singular en español de cada unidad ("1 árbol").
update proyectos_sociales set unidad_singular = case unidad
  when 'semillas' then 'semilla'
  when 'árboles'  then 'árbol'
  when 'horas'    then 'hora'
  when 'talleres' then 'taller'
  else unidad end
where unidad_singular is null;
`);

sql(`-- Especies`);
for (const sci of claves("especies")) {
  sql(`update especies set traducciones = ${json(porIdioma("especies", sci))} where nombre_cientifico = ${lit(sci)};`);
}

sql(`\n-- Proyectos sociales`);
for (const slug of claves("proyectos")) {
  sql(`update proyectos_sociales set traducciones = ${json(porIdioma("proyectos", slug))} where slug = ${lit(slug)};`);
}

sql(`\n-- Bitácora (por el texto en español de cada entrada)`);
for (const detalle of claves("registros")) {
  sql(`update impacto_registros set traducciones = ${json(porIdioma("registros", detalle, (v) => ({ detalle: v })))} where detalle = ${lit(detalle)};`);
}

sql(`\n-- Ajustes del sitio`);
for (const clave of claves("ajustes")) {
  sql(`update ajustes set traducciones = ${json(porIdioma("ajustes", clave, (v) => ({ valor: v })))} where clave = ${lit(clave)};`);
}

sql(`\nnotify pgrst, 'reload schema';\n`);
fs.writeFileSync("supabase/migraciones/007_traducciones.sql", lineas.join("\n"));
console.log("supabase/migraciones/007_traducciones.sql generado");
