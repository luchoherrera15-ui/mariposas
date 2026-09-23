import type { Metadata } from "next";
import { Area, Bloque, Campo, Casilla } from "@/components/admin/campos";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { listarEspecies } from "@/lib/admin";
import { moneda } from "@/lib/formato";
import { eliminarEspecie, guardarEspecie } from "../acciones";

export const metadata: Metadata = { title: "Catálogo" };

export default async function EspeciesAdmin() {
  const especies = await listarEspecies();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="titulo-2">Catálogo de especies</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          Lo que esté marcado como activo aparece en el sitio público. El precio no se muestra a los visitantes: se
          usa para calcular el total de cada pedido.
        </p>
      </div>

      <Bloque titulo="Agregar una especie">
        <FormularioAccion accion={guardarEspecie} boton="Crear especie">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Campo etiqueta="Nombre común" name="nombre_comun" required placeholder="Morpho azul" />
            <Campo etiqueta="Nombre científico" name="nombre_cientifico" required placeholder="Morpho peleides" />
            <Campo etiqueta="Familia" name="familia" placeholder="Nymphalidae" />
            <Campo etiqueta="Origen" name="region" placeholder="Costa Rica" />
            <Campo etiqueta="Precio por pupa" name="precio_unitario" type="number" min={0} step="0.01" />
            <div className="flex items-end pb-2">
              <Casilla etiqueta="Activa en el sitio" name="activo" defaultChecked />
            </div>
            <Area etiqueta="Descripción" name="descripcion" className="sm:col-span-2 lg:col-span-3" />
          </div>
        </FormularioAccion>
      </Bloque>

      <div className="space-y-5">
        <h2 className="titulo-3">
          {especies.length} {especies.length === 1 ? "especie" : "especies"}
        </h2>

        {especies.map((e) => (
          <div key={e.id} className="border border-linea bg-papel p-6">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <p className="titulo-3">
                {e.nombre_comun} <span className="cientifico text-base text-pizarra">{e.nombre_cientifico}</span>
              </p>
              <p className="datos text-sm text-pizarra">{moneda(e.precio_unitario)} por pupa</p>
            </div>

            <FormularioAccion accion={guardarEspecie} boton="Guardar cambios">
              <input type="hidden" name="especie_id" value={e.id} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Nombre común" name="nombre_comun" defaultValue={e.nombre_comun} required />
                <Campo
                  etiqueta="Nombre científico"
                  name="nombre_cientifico"
                  defaultValue={e.nombre_cientifico}
                  required
                  ayuda="Es la llave que enlaza la foto y la ficha técnica."
                />
                <Campo etiqueta="Familia" name="familia" defaultValue={e.familia ?? ""} />
                <Campo etiqueta="Origen" name="region" defaultValue={e.region ?? ""} />
                <Campo
                  etiqueta="Precio por pupa"
                  name="precio_unitario"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={e.precio_unitario}
                />
                <div className="flex items-end pb-2">
                  <Casilla etiqueta="Activa en el sitio" name="activo" defaultChecked={e.activo} />
                </div>
                <Area
                  etiqueta="Descripción"
                  name="descripcion"
                  defaultValue={e.descripcion ?? ""}
                  className="sm:col-span-2 lg:col-span-3"
                />
              </div>
            </FormularioAccion>

            <form action={eliminarEspecie} className="mt-4 border-t border-linea pt-4">
              <input type="hidden" name="especie_id" value={e.id} />
              <button className="text-xs text-pizarra transition-colors hover:text-red-800">
                Eliminar esta especie (si tiene pedidos, solo se desactiva)
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
