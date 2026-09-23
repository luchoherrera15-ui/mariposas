/**
 * Descarga fotos de las especies del catálogo desde Wikimedia Commons y
 * escribe public/fotos/*.jpg más lib/fotos.ts con el crédito de cada una.
 *
 *   node scripts/bajar-fotos.mjs
 *
 * Todas las imágenes de Commons exigen atribución (CC BY o CC BY-SA). El
 * crédito que genera este script se muestra en /creditos y bajo cada foto.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AGENTE = "AlasDePoasDemo/1.0 (sitio de demostracion; contacto: ventas@alasdepoas.cr)";

/** slug → búsqueda en Commons. El orden es el del catálogo. */
const OBJETIVOS = [
  { slug: "portada", busqueda: "Morpho helenor peleides", preferir: ["Sharp"], ancho: 2400 },
  { slug: "morpho-azul", busqueda: "Morpho peleides butterfly wings open", preferir: ["Bresson"] },
  { slug: "buho-gigante", archivo: "Caligo Memnon Owl Butterfly.jpg" },
  { slug: "monarca", busqueda: "Danaus plexippus butterfly flower", preferir: ["Sharp"] },
  { slug: "alas-de-cristal", busqueda: "Greta oto" },
  { slug: "cebra", busqueda: "Heliconius charithonia", preferir: ["Sharp"] },
  { slug: "cola-de-golondrina", busqueda: "Papilio thoas butterfly" },
  { slug: "malaquita", busqueda: "Siproeta stelenes", preferir: ["Sharp"] },
  { slug: "ochenta-y-ocho", busqueda: "Diaethria", preferir: ["Sharp"] },
];

/** Titulos ya usados, para no repetir la misma foto en dos lugares. */
const usados = new Set();

/** Fuera: dibujos, especímenes clavados, orugas, mapas, partes sueltas. */
const DESCARTAR =
  /(underside|caterpillar|larva|pupa|chrysalis|egg|mounted|specimen|plate|drawing|illustration|map|distribution|stamp|collection|dorsal view of|set |white background|MHNT|museum|verso|recto|hand|finger|shirt|child|girl|boy|person)/i;

async function api(parametros) {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams(parametros)}`;
  const respuesta = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!respuesta.ok) throw new Error(`API ${respuesta.status} en ${parametros.gsrsearch}`);
  return respuesta.json();
}

function limpiar(html) {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function buscar({ busqueda, archivo, preferir = [], ancho = 1800 }) {
  // Un archivo fijado a mano gana sobre la búsqueda: para cuando el ranking
  // de Commons no devuelve una foto usable.
  if (archivo) {
    const datos = await api({
      action: "query", format: "json", titles: `File:${archivo}`,
      prop: "imageinfo", iiprop: "url|extmetadata|size|mime", iiurlwidth: String(ancho),
    });
    const pagina = Object.values(datos.query?.pages ?? {})[0];
    const info = pagina?.imageinfo?.[0];
    if (!info) return null;
    const meta = info.extmetadata ?? {};
    return {
      titulo: archivo, thumb: info.thumburl, pagina: info.descriptionurl,
      ancho: info.width, alto: info.height, mime: info.mime,
      autor: limpiar(meta.Artist?.value) || "Autor no indicado",
      licencia: limpiar(meta.LicenseShortName?.value) || "Ver página de origen",
    };
  }

  const datos = await api({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: busqueda,
    gsrnamespace: "6",
    gsrlimit: "24",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size|mime",
    iiurlwidth: String(ancho),
  });

  const paginas = Object.values(datos.query?.pages ?? {});
  const candidatos = paginas
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata ?? {};
      return {
        titulo: p.title.replace(/^File:/, ""),
        thumb: info.thumburl,
        pagina: info.descriptionurl,
        ancho: info.width,
        alto: info.height,
        mime: info.mime,
        autor: limpiar(meta.Artist?.value) || "Autor no indicado",
        licencia: limpiar(meta.LicenseShortName?.value) || "Ver página de origen",
      };
    })
    .filter(Boolean)
    .filter((c) => /jpeg|jpg/i.test(c.mime ?? ""))
    .filter((c) => !DESCARTAR.test(c.titulo))
    // Horizontales primero: encajan mejor en tarjetas y en el encabezado.
    .filter((c) => c.ancho >= 1600)
    .filter((c) => !usados.has(c.titulo));

  candidatos.sort((a, b) => {
    const puntaje = (c) => {
      let n = 0;
      if (preferir.some((autor) => c.autor.includes(autor))) n += 100;
      if (c.ancho > c.alto) n += 40; // apaisada
      n += Math.min(20, c.ancho / 400);
      return n;
    };
    return puntaje(b) - puntaje(a);
  });

  return candidatos[0] ?? null;
}

async function bajar(url, destino) {
  const respuesta = await fetch(url, { headers: { "User-Agent": AGENTE } });
  if (!respuesta.ok) throw new Error(`descarga ${respuesta.status}`);
  const datos = Buffer.from(await respuesta.arrayBuffer());
  await writeFile(destino, datos);
  return datos.length;
}

const creditos = {};
await mkdir(resolve(RAIZ, "public/fotos"), { recursive: true });

for (const objetivo of OBJETIVOS) {
  try {
    const elegida = await buscar(objetivo);
    if (!elegida) {
      console.log(`  sin resultados: ${objetivo.slug}`);
      continue;
    }
    usados.add(elegida.titulo);
    const destino = resolve(RAIZ, "public/fotos", `${objetivo.slug}.jpg`);
    const bytes = await bajar(elegida.thumb, destino);
    creditos[objetivo.slug] = {
      autor: elegida.autor,
      licencia: elegida.licencia,
      origen: elegida.pagina,
      titulo: elegida.titulo,
    };
    console.log(`  ${objetivo.slug.padEnd(20)} ${(bytes / 1024).toFixed(0).padStart(5)} KB  ${elegida.autor} (${elegida.licencia})`);
  } catch (error) {
    console.log(`  fallo ${objetivo.slug}: ${error.message}`);
  }
}

const archivo = `// Generado por scripts/bajar-fotos.mjs. No editar a mano.
// Todas las fotos vienen de Wikimedia Commons y exigen atribución.

export type CreditoFoto = {
  autor: string;
  licencia: string;
  origen: string;
  titulo: string;
};

export const creditos: Record<string, CreditoFoto> = ${JSON.stringify(creditos, null, 2)};

/** Ruta pública de la foto de una especie, o null si no se descargó. */
export function foto(slug: string) {
  return creditos[slug] ? \`/fotos/\${slug}.jpg\` : null;
}
`;
await writeFile(resolve(RAIZ, "lib/fotos.ts"), archivo);
console.log(`\nListo: ${Object.keys(creditos).length} fotos en public/fotos + lib/fotos.ts`);
