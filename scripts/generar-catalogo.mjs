// Genera supabase/migraciones/011_catalogo_ampliado.sql:
//  - columnas nuevas en especies (slug, envergadura, vuelo, disponibilidad, destacada),
//  - pasa las fichas que vivían en lib/fichas.ts a la base,
//  - agrega las 42 especies de supabase/catalogo/nuevas-*.json.
// Correr con: node scripts/generar-catalogo.mjs
import { execSync } from "node:child_process";
import fs from "node:fs";

const IDIOMAS = ["en", "it", "fr", "zh"];
const lit = (t) => (t === null || t === undefined ? "null" : `'${String(t).replaceAll("'", "''")}'`);
const json = (v) => `${lit(JSON.stringify(v))}::jsonb`;
const kebab = (sci) => sci.toLowerCase().replace(/\s+/g, "-");

// Fichas de las 8 especies originales (lib/fichas.ts, objeto FICHAS).
// lib/fichas.ts ya no existe (las fichas viven en la base): se lee de git.
const fuente = execSync("git show b2ffe6f:lib/fichas.ts", { encoding: "utf8" });
const literal = fuente.match(/const FICHAS[^=]*=\s*(\{[\s\S]*?\n\});/)[1];
const FICHAS = new Function(`return ${literal}`)();

const DISPONIBILIDAD = {
  es: "Bajo pedido",
  en: "On request",
  it: "Su richiesta",
  fr: "Sur demande",
  zh: "按需供应",
};

// Las cuatro que hoy abren la portada (las de mayor precio).
const DESTACADAS = ["Greta oto", "Morpho peleides", "Papilio thoas", "Caligo memnon"];

const nuevas = [1, 2, 3].flatMap((n) => JSON.parse(fs.readFileSync(`supabase/catalogo/nuevas-${n}.json`, "utf8")));

const l = [];
l.push(`-- ============================================================================
--  Catálogo ampliado a 50 especies + fichas en la base.
--  GENERADO por scripts/generar-catalogo.mjs — no editar a mano.
--  Idempotente: las especies se insertan o se actualizan por nombre científico.
-- ============================================================================

set search_path = mariposas, public, extensions;

alter table especies add column if not exists slug           text;
alter table especies add column if not exists envergadura    text;
alter table especies add column if not exists vuelo          text;
alter table especies add column if not exists disponibilidad text;
alter table especies add column if not exists destacada      boolean not null default false;

-- Slug para la página de cada especie: el nombre científico en kebab-case.
update especies set slug = lower(regexp_replace(trim(nombre_cientifico), '\\s+', '-', 'g')) where slug is null;
create unique index if not exists especies_slug_idx on especies (slug);

-- El catálogo público lee estas columnas (el precio sigue sin ser público).
grant select (slug, envergadura, vuelo, disponibilidad, destacada) on especies to anon, authenticated;
`);

l.push(`-- Fichas de las especies originales (antes en lib/fichas.ts)`);
for (const [sci, f] of Object.entries(FICHAS)) {
  const extra = Object.fromEntries(IDIOMAS.map((i) => [i, { vuelo: f.vuelo[i], disponibilidad: f.disponibilidad[i] }]));
  l.push(
    `update especies set envergadura = ${lit(f.envergadura)}, vuelo = ${lit(f.vuelo.es)}, disponibilidad = ${lit(f.disponibilidad.es)},` +
      ` destacada = ${DESTACADAS.includes(sci)},` +
      ` traducciones = coalesce(traducciones, '{}'::jsonb) || (select jsonb_object_agg(k, coalesce(traducciones->k, '{}'::jsonb) || v) from jsonb_each(${json(extra)}) as e(k, v))` +
      ` where nombre_cientifico = ${lit(sci)};`,
  );
}

l.push(`\n-- 42 especies nuevas (precio en 0: se carga desde /admin/especies)`);
for (const e of nuevas) {
  const traducciones = Object.fromEntries(
    IDIOMAS.map((i) => [i, { ...e.i18n[i], disponibilidad: DISPONIBILIDAD[i] }]),
  );
  const es = e.i18n.es;
  l.push(
    `insert into especies (nombre_comun, nombre_cientifico, familia, region, precio_unitario, descripcion, slug, envergadura, vuelo, disponibilidad, activo, traducciones) values (` +
      [lit(es.nombre_comun), lit(e.nombre_cientifico), lit(e.familia), lit(es.region), "0", lit(es.descripcion),
        lit(e.slug || kebab(e.nombre_cientifico)), lit(e.envergadura), lit(es.vuelo), lit(DISPONIBILIDAD.es), "true", json(traducciones)].join(", ") +
      `)\non conflict (nombre_cientifico) do update set nombre_comun = excluded.nombre_comun, familia = excluded.familia, region = excluded.region,` +
      ` descripcion = excluded.descripcion, slug = excluded.slug, envergadura = excluded.envergadura, vuelo = excluded.vuelo,` +
      ` traducciones = excluded.traducciones;`,
  );
}

l.push(`\nnotify pgrst, 'reload schema';\n`);
fs.writeFileSync("supabase/migraciones/011_catalogo_ampliado.sql", l.join("\n"));
console.log(`011_catalogo_ampliado.sql: ${Object.keys(FICHAS).length} fichas + ${nuevas.length} especies nuevas`);
