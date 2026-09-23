import type { Metadata } from "next";
import Link from "next/link";
import { Area, Campo } from "@/components/admin/campos";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { listarAjustes } from "@/lib/admin";
import type { Traducciones } from "@/lib/i18n/contenido";
import { IDIOMA_BASE_CONTENIDO, IDIOMAS, NOMBRE_IDIOMA, esIdioma } from "@/lib/i18n/idiomas";
import { guardarAjustes } from "../acciones";

export const metadata: Metadata = { title: "Textos del sitio" };

/** Datos de contacto: son iguales en todos los idiomas, se editan solo en español. */
const SIN_TRADUCCION = new Set(["marca_nombre", "marca_correo", "marca_telefono"]);

export default async function AjustesAdmin({ searchParams }: { searchParams: Promise<{ idioma?: string }> }) {
  const { idioma: pedido } = await searchParams;
  const idioma = esIdioma(pedido) ? pedido : IDIOMA_BASE_CONTENIDO;
  const esBase = idioma === IDIOMA_BASE_CONTENIDO;
  const ajustes = (await listarAjustes()).filter((a) => esBase || !SIN_TRADUCCION.has(a.clave));

  // Se agrupan tal como vienen de la tabla, respetando `grupo` y `orden`.
  const grupos = new Map<string, typeof ajustes>();
  for (const a of ajustes) {
    const lista = grupos.get(a.grupo) ?? [];
    lista.push(a);
    grupos.set(a.grupo, lista);
  }

  const valorEn = (a: (typeof ajustes)[number]) =>
    esBase ? a.valor : ((a.traducciones as Traducciones)?.[idioma]?.valor ?? "");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">Textos y cifras del sitio</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          Todo lo que se ve en el sitio público sin venir de la base de datos: el titular, las tres cifras del
          encabezado, los datos de contacto y las condiciones de envío. El sitio abre en inglés: revisá esa
          pestaña cada vez que cambies el español. Si un idioma deja un campo vacío, se muestra el texto en español.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1.5">
        {IDIOMAS.slice()
          .sort((a, b) => (a === IDIOMA_BASE_CONTENIDO ? -1 : b === IDIOMA_BASE_CONTENIDO ? 1 : 0))
          .map((i) => (
            <Link
              key={i}
              href={`/admin/ajustes?idioma=${i}`}
              aria-current={i === idioma ? "page" : undefined}
              className={`px-3.5 py-2 text-sm transition-colors ${
                i === idioma ? "bg-noche text-white" : "border border-linea hover:border-tinta"
              }`}
            >
              {NOMBRE_IDIOMA[i]}
              {i === IDIOMA_BASE_CONTENIDO ? " (base)" : ""}
            </Link>
          ))}
      </nav>

      {ajustes.length === 0 ? (
        <p className="border border-dashed border-linea p-8 text-sm text-pizarra">
          No hay ajustes cargados. Corré <code className="datos">005_ajustes.sql</code> en el SQL Editor de Supabase.
        </p>
      ) : (
        // `key` remonta el formulario al cambiar de idioma para que tome los valores nuevos.
        <FormularioAccion
          key={idioma}
          accion={guardarAjustes}
          boton={`Guardar ${NOMBRE_IDIOMA[idioma]}`}
          className="space-y-8"
        >
          <input type="hidden" name="idioma" value={idioma} />
          {[...grupos.entries()].map(([grupo, campos]) => (
            <section key={grupo} className="border border-linea bg-papel p-6">
              <h2 className="titulo-3">{grupo}</h2>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {campos.map((a) => {
                  // Fuera del español, la ayuda muestra el texto base como referencia.
                  const ayuda = esBase ? a.ayuda : [a.ayuda, `Español: ${a.valor}`].filter(Boolean).join(" · ");
                  return a.multilinea ? (
                    <Area
                      key={a.clave}
                      etiqueta={a.etiqueta}
                      ayuda={ayuda}
                      name={`ajuste_${a.clave}`}
                      defaultValue={valorEn(a)}
                      rows={a.valor.length > 160 ? 5 : 3}
                      className="lg:col-span-2"
                    />
                  ) : (
                    <Campo
                      key={a.clave}
                      etiqueta={a.etiqueta}
                      ayuda={ayuda}
                      name={`ajuste_${a.clave}`}
                      defaultValue={valorEn(a)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </FormularioAccion>
      )}
    </div>
  );
}
