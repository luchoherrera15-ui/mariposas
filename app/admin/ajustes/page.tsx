import type { Metadata } from "next";
import { Area, Campo } from "@/components/admin/campos";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { listarAjustes } from "@/lib/admin";
import { guardarAjustes } from "../acciones";

export const metadata: Metadata = { title: "Textos del sitio" };

export default async function AjustesAdmin() {
  const ajustes = await listarAjustes();

  // Se agrupan tal como vienen de la tabla, respetando `grupo` y `orden`.
  const grupos = new Map<string, typeof ajustes>();
  for (const a of ajustes) {
    const lista = grupos.get(a.grupo) ?? [];
    lista.push(a);
    grupos.set(a.grupo, lista);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">Textos y cifras del sitio</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          Todo lo que se ve en el sitio público sin venir de la base de datos: el titular, las tres cifras del
          encabezado, los datos de contacto y las condiciones de envío. Se guarda todo junto.
        </p>
      </div>

      {ajustes.length === 0 ? (
        <p className="border border-dashed border-linea p-8 text-sm text-pizarra">
          No hay ajustes cargados. Corré <code className="datos">005_ajustes.sql</code> en el SQL Editor de Supabase.
        </p>
      ) : (
        <FormularioAccion accion={guardarAjustes} boton="Guardar todos los cambios" className="space-y-8">
          {[...grupos.entries()].map(([grupo, campos]) => (
            <section key={grupo} className="border border-linea bg-papel p-6">
              <h2 className="titulo-3">{grupo}</h2>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {campos.map((a) =>
                  a.multilinea ? (
                    <Area
                      key={a.clave}
                      etiqueta={a.etiqueta}
                      ayuda={a.ayuda}
                      name={`ajuste_${a.clave}`}
                      defaultValue={a.valor}
                      rows={a.valor.length > 160 ? 5 : 3}
                      className="lg:col-span-2"
                    />
                  ) : (
                    <Campo
                      key={a.clave}
                      etiqueta={a.etiqueta}
                      ayuda={a.ayuda}
                      name={`ajuste_${a.clave}`}
                      defaultValue={a.valor}
                    />
                  ),
                )}
              </div>
            </section>
          ))}
        </FormularioAccion>
      )}
    </div>
  );
}
