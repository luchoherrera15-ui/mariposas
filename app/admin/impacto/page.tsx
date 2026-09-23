import type { Metadata } from "next";
import { Area, Bloque, Campo, Selector } from "@/components/admin/campos";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { listarProyectos, listarRegistrosImpacto } from "@/lib/admin";
import { fecha, numero } from "@/lib/formato";
import { agregarRegistroImpacto, eliminarRegistroImpacto, guardarProyecto } from "../acciones";

export const metadata: Metadata = { title: "Trabajo social" };

export default async function ImpactoAdmin() {
  const [proyectos, registros] = await Promise.all([listarProyectos(), listarRegistrosImpacto()]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="titulo-2">Trabajo social</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          La regla de cada proyecto es lo que convierte mariposas vendidas en unidades de impacto, tanto en el sitio
          público como en el panel de cada cliente. La bitácora es lo ya ejecutado, con evidencia.
        </p>
      </div>

      {/* ── Registrar lo ejecutado ─────────────────────────────────────── */}
      <Bloque titulo="Registrar una entrega ejecutada">
        <FormularioAccion accion={agregarRegistroImpacto} boton="Agregar a la bitácora" compacto>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Selector etiqueta="Proyecto" name="proyecto_id" required defaultValue="">
              <option value="" disabled>
                Elegí un proyecto
              </option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </Selector>
            <Campo etiqueta="Cantidad" name="cantidad" type="number" step="0.01" required />
            <Campo
              etiqueta="Fecha"
              name="fecha"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
            <Campo etiqueta="Detalle" name="detalle" placeholder="Entrega a 14 familias de Cerro Alto" />
          </div>
        </FormularioAccion>
      </Bloque>

      {/* ── Proyectos y reglas ─────────────────────────────────────────── */}
      <div className="space-y-5">
        <h2 className="titulo-3">Proyectos y sus reglas</h2>

        {proyectos.map((p) => (
          <div key={p.id} className="border border-linea bg-papel p-6">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <p className="titulo-3">{p.nombre}</p>
              <p className="datos text-sm text-pizarra">
                {numero(p.ejecutado)} {p.unidad} ejecutados
              </p>
            </div>

            <FormularioAccion accion={guardarProyecto} boton="Guardar proyecto">
              <input type="hidden" name="proyecto_id" value={p.id} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Campo etiqueta="Nombre" name="nombre" defaultValue={p.nombre} required />
                <Campo
                  etiqueta="Identificador"
                  name="slug"
                  defaultValue={p.slug}
                  required
                  ayuda="Sin espacios ni acentos."
                />
                <Campo
                  etiqueta="Unidad"
                  name="unidad"
                  defaultValue={p.unidad}
                  required
                  ayuda="semillas, árboles, horas…"
                />
                <Campo etiqueta="Meta anual" name="meta_anual" type="number" step="0.01" defaultValue={p.meta_anual ?? ""} />
                <Campo etiqueta="Orden" name="orden" type="number" defaultValue={p.orden} />
                <Area
                  etiqueta="Descripción"
                  name="descripcion"
                  defaultValue={p.descripcion ?? ""}
                  className="sm:col-span-2 lg:col-span-1"
                />
              </div>

              <div className="mt-6 border-t border-linea pt-5">
                <p className="text-sm">
                  Regla de conversión:{" "}
                  <span className="text-pizarra">cada N mariposas vendidas equivalen a X {p.unidad}.</span>
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Campo
                    etiqueta="Cada cuántas mariposas"
                    name="mariposas_por_bloque"
                    type="number"
                    min={1}
                    defaultValue={p.regla?.mariposas_por_bloque ?? 1}
                  />
                  <Campo
                    etiqueta={`Cuántas ${p.unidad}`}
                    name="unidades_por_bloque"
                    type="number"
                    step="0.01"
                    defaultValue={p.regla?.unidades_por_bloque ?? 1}
                  />
                </div>
              </div>
            </FormularioAccion>
          </div>
        ))}
      </div>

      {/* ── Nuevo proyecto ─────────────────────────────────────────────── */}
      <Bloque titulo="Agregar un proyecto">
        <FormularioAccion accion={guardarProyecto} boton="Crear proyecto">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Campo etiqueta="Nombre" name="nombre" required placeholder="Becas escolares" />
            <Campo etiqueta="Identificador" name="slug" required placeholder="becas-escolares" />
            <Campo etiqueta="Unidad" name="unidad" required placeholder="becas" />
            <Campo etiqueta="Meta anual" name="meta_anual" type="number" step="0.01" />
            <Campo etiqueta="Cada cuántas mariposas" name="mariposas_por_bloque" type="number" min={1} />
            <Campo etiqueta="Cuántas unidades" name="unidades_por_bloque" type="number" step="0.01" />
            <Area etiqueta="Descripción" name="descripcion" className="sm:col-span-2 lg:col-span-3" />
          </div>
        </FormularioAccion>
      </Bloque>

      {/* ── Bitácora ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="titulo-3">Bitácora</h2>
        <div className="mt-4 overflow-x-auto border border-linea bg-papel">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-linea text-left text-pizarra">
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 font-normal">Proyecto</th>
                <th className="px-4 py-3 font-normal">Detalle</th>
                <th className="px-4 py-3 text-right font-normal">Cantidad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {registros.map((r) => (
                <tr key={r.id}>
                  <td className="datos px-4 py-3 text-pizarra">{fecha(r.fecha)}</td>
                  <td className="px-4 py-3">{r.proyecto}</td>
                  <td className="px-4 py-3 text-pizarra">{r.detalle}</td>
                  <td className="datos px-4 py-3 text-right">
                    {numero(r.cantidad)} {r.unidad}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={eliminarRegistroImpacto}>
                      <input type="hidden" name="registro_id" value={r.id} />
                      <button className="text-xs text-pizarra transition-colors hover:text-red-800">Quitar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
