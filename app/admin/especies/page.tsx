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
            <Campo etiqueta="Envergadura" name="envergadura" placeholder="95–120 mm" />
            <Campo etiqueta="Vuelo" name="vuelo" placeholder="Lento y planeado" />
            <Campo etiqueta="Disponibilidad" name="disponibilidad" placeholder="Todo el año" />
            <div className="flex flex-wrap items-end gap-5 pb-2">
              <Casilla etiqueta="Activa en el sitio" name="activo" defaultChecked />
              <Casilla etiqueta="Destacada en la portada" name="destacada" />
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
          <details key={e.id} className="group border border-linea bg-papel">
            <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-nube/60">
              <span className="text-pizarra transition-transform group-open:rotate-90">›</span>
              <span className="font-medium">{e.nombre_comun}</span>
              <span className="cientifico text-sm text-pizarra">{e.nombre_cientifico}</span>
              <span className="datos text-xs text-pizarra">{e.familia}</span>
              <span className="ml-auto flex items-baseline gap-3 text-xs">
                {e.destacada ? <span className="text-morpho">destacada</span> : null}
                {!e.activo ? <span className="text-red-800">inactiva</span> : null}
                <span className={`datos ${e.precio_unitario ? "text-pizarra" : "text-red-800"}`}>
                  {e.precio_unitario ? `${moneda(e.precio_unitario)} por pupa` : "sin precio"}
                </span>
              </span>
            </summary>
            <div className="border-t border-linea p-6">

            <FormularioAccion accion={guardarEspecie} boton="Guardar cambios">
              <input type="hidden" name="especie_id" value={e.id} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Nombre común" name="nombre_comun" defaultValue={e.nombre_comun} required />
                <Campo
                  etiqueta="Nombre científico"
                  name="nombre_cientifico"
                  defaultValue={e.nombre_cientifico}
                  required
                  ayuda="Enlaza la foto y define la dirección de su página (/especies/…)."
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
                <Campo etiqueta="Envergadura" name="envergadura" defaultValue={e.envergadura ?? ""} />
                <Campo etiqueta="Vuelo" name="vuelo" defaultValue={e.vuelo ?? ""} />
                <Campo
                  etiqueta="Disponibilidad"
                  name="disponibilidad"
                  defaultValue={e.disponibilidad ?? ""}
                  ayuda="Ej.: Todo el año · Bajo pedido · Marzo a octubre"
                />
                <div className="flex flex-wrap items-end gap-5 pb-2">
                  <Casilla etiqueta="Activa en el sitio" name="activo" defaultChecked={e.activo} />
                  <Casilla etiqueta="Destacada en la portada" name="destacada" defaultChecked={e.destacada} />
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
          </details>
        ))}
      </div>
    </div>
  );
}
