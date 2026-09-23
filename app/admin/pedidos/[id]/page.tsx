import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bloque,
  Campo,
  ESTADOS_ENVIO,
  ESTADOS_PEDIDO,
  Selector,
} from "@/components/admin/campos";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { Chip } from "@/components/ui";
import { listarClientes, listarEspecies, obtenerPedidoAdmin } from "@/lib/admin";
import {
  colorEnvio,
  colorPedido,
  etiquetaEnvio,
  etiquetaPedido,
  fecha,
  fechaHora,
  moneda,
  numero,
} from "@/lib/formato";
import {
  actualizarPedido,
  agregarEvento,
  agregarItem,
  eliminarEvento,
  eliminarItem,
  eliminarPedido,
  guardarEnvio,
} from "../../acciones";

export const metadata: Metadata = { title: "Editar pedido" };

/** "2026-09-04" para inputs date. */
const soloFecha = (v: string | null) => (v ? v.slice(0, 10) : "");
/** "2026-09-04T13:20" para inputs datetime-local. */
const fechaHoraLocal = (v: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default async function EditarPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pedido, especies, clientes] = await Promise.all([
    obtenerPedidoAdmin(id),
    listarEspecies(),
    listarClientes(),
  ]);
  if (!pedido) notFound();

  const cliente = clientes.find((c) => c.id === pedido.cliente_id);
  const mariposas = pedido.items.reduce((s, i) => s + i.cantidad, 0);
  const envio = pedido.envio;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/pedidos" className="text-sm text-pizarra transition-colors hover:text-tinta">
          Todos los pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="datos text-2xl">{pedido.codigo}</h1>
            <Chip className={colorPedido[pedido.estado]}>{etiquetaPedido[pedido.estado]}</Chip>
          </div>
          <p className="text-sm text-pizarra">
            {cliente ? `${cliente.nombre} · ${cliente.email}` : "Cliente desconocido"}
          </p>
        </div>
        <p className="datos mt-2 text-sm text-pizarra">
          {numero(mariposas)} mariposas · {moneda(pedido.total, pedido.moneda)} · creado {fecha(pedido.creado_en)}
        </p>
      </div>

      {/* ── Datos del pedido ───────────────────────────────────────────── */}
      <Bloque titulo="Datos del pedido">
        <FormularioAccion accion={actualizarPedido}>
          <input type="hidden" name="pedido_id" value={pedido.id} />
          <div className="grid gap-5 sm:grid-cols-3">
            <Selector etiqueta="Estado" name="estado" defaultValue={pedido.estado}>
              {ESTADOS_PEDIDO.map((e) => (
                <option key={e} value={e}>
                  {etiquetaPedido[e]}
                </option>
              ))}
            </Selector>
            <Campo etiqueta="Moneda" name="moneda" defaultValue={pedido.moneda} maxLength={3} />
            <Campo etiqueta="Nota (la ve el cliente)" name="notas" defaultValue={pedido.notas ?? ""} />
          </div>
        </FormularioAccion>
      </Bloque>

      {/* ── Líneas del pedido ──────────────────────────────────────────── */}
      <Bloque titulo="Especies del pedido">
        {pedido.items.length === 0 ? (
          <p className="text-sm text-pizarra">Todavía no hay líneas. Agregá la primera abajo.</p>
        ) : (
          <div className="overflow-x-auto border border-linea">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-linea bg-lino text-left text-pizarra">
                  <th className="px-4 py-2.5 font-normal">Especie</th>
                  <th className="px-4 py-2.5 text-right font-normal">Cantidad</th>
                  <th className="px-4 py-2.5 text-right font-normal">Precio</th>
                  <th className="px-4 py-2.5 text-right font-normal">Subtotal</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {pedido.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5">
                      {i.especie?.nombre_comun}
                      <span className="cientifico ml-2 text-xs text-pizarra">{i.especie?.nombre_cientifico}</span>
                    </td>
                    <td className="datos px-4 py-2.5 text-right">{numero(i.cantidad)}</td>
                    <td className="datos px-4 py-2.5 text-right">{moneda(i.precio_unitario, pedido.moneda)}</td>
                    <td className="datos px-4 py-2.5 text-right">
                      {moneda(i.cantidad * i.precio_unitario, pedido.moneda)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={eliminarItem}>
                        <input type="hidden" name="item_id" value={i.id} />
                        <input type="hidden" name="pedido_id" value={pedido.id} />
                        <button className="text-xs text-pizarra transition-colors hover:text-red-800">Quitar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 border-t border-linea pt-6">
          <FormularioAccion accion={agregarItem} boton="Agregar línea" compacto>
            <input type="hidden" name="pedido_id" value={pedido.id} />
            <div className="grid gap-5 sm:grid-cols-3">
              <Selector etiqueta="Especie" name="especie_id" required defaultValue="">
                <option value="" disabled>
                  Elegí una especie
                </option>
                {especies.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre_comun}
                  </option>
                ))}
              </Selector>
              <Campo etiqueta="Cantidad" name="cantidad" type="number" min={1} step={1} required />
              <Campo
                etiqueta="Precio por pupa"
                name="precio_unitario"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </FormularioAccion>
        </div>
      </Bloque>

      {/* ── Envío ──────────────────────────────────────────────────────── */}
      <Bloque titulo={envio ? "Envío" : "Crear el envío"}>
        <FormularioAccion accion={guardarEnvio} boton={envio ? "Guardar envío" : "Crear envío"}>
          <input type="hidden" name="pedido_id" value={pedido.id} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Selector etiqueta="Estado del envío" name="estado" defaultValue={envio?.estado ?? "preparando"}>
              {ESTADOS_ENVIO.map((e) => (
                <option key={e} value={e}>
                  {etiquetaEnvio[e]}
                </option>
              ))}
            </Selector>
            <Campo etiqueta="Transportista" name="transportista" defaultValue={envio?.transportista ?? ""} />
            <Campo etiqueta="Número de guía" name="numero_guia" defaultValue={envio?.numero_guia ?? ""} />
            <Campo etiqueta="Origen" name="origen" defaultValue={envio?.origen ?? ""} />
            <Campo etiqueta="Destino" name="destino" defaultValue={envio?.destino ?? ""} />
            <Campo
              etiqueta="Temperatura (°C)"
              name="temperatura_c"
              type="number"
              step="0.1"
              defaultValue={envio?.temperatura_c ?? ""}
            />
            <Campo
              etiqueta="Despachado"
              name="enviado_en"
              type="date"
              defaultValue={soloFecha(envio?.enviado_en ?? null)}
            />
            <Campo
              etiqueta="Entrega estimada"
              name="entrega_estimada"
              type="date"
              defaultValue={soloFecha(envio?.entrega_estimada ?? null)}
            />
            <Campo
              etiqueta="Entregado"
              name="entregado_en"
              type="date"
              defaultValue={soloFecha(envio?.entregado_en ?? null)}
            />
            <Campo
              etiqueta="Enlace de rastreo del transportista"
              name="url_rastreo"
              type="url"
              defaultValue={envio?.url_rastreo ?? ""}
              className="sm:col-span-2 lg:col-span-3"
            />
          </div>
        </FormularioAccion>
      </Bloque>

      {/* ── Movimientos del tracking ───────────────────────────────────── */}
      <Bloque titulo="Movimientos del tracking">
        {!envio ? (
          <p className="text-sm text-pizarra">Creá primero el envío para poder cargar movimientos.</p>
        ) : (
          <>
            {(envio.eventos ?? []).length === 0 ? (
              <p className="text-sm text-pizarra">Sin movimientos todavía.</p>
            ) : (
              <ul className="divide-y divide-linea border-y border-linea">
                {(envio.eventos ?? []).map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 text-sm">
                    <Chip className={colorEnvio[e.estado as keyof typeof colorEnvio] ?? "bg-nube"}>
                      {etiquetaEnvio[e.estado as keyof typeof etiquetaEnvio] ?? e.estado}
                    </Chip>
                    <span className="datos text-xs text-pizarra">{fechaHora(e.ocurrido_en)}</span>
                    <span className="text-pizarra">{e.ubicacion}</span>
                    <span className="min-w-0 flex-1">{e.descripcion}</span>
                    <form action={eliminarEvento}>
                      <input type="hidden" name="evento_id" value={e.id} />
                      <input type="hidden" name="pedido_id" value={pedido.id} />
                      <button className="text-xs text-pizarra transition-colors hover:text-red-800">Quitar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 border-t border-linea pt-6">
              <p className="mb-5 text-sm text-pizarra">
                Al agregar un movimiento, el estado del envío pasa al de ese movimiento.
              </p>
              <FormularioAccion accion={agregarEvento} boton="Agregar movimiento" compacto>
                <input type="hidden" name="envio_id" value={envio.id} />
                <input type="hidden" name="pedido_id" value={pedido.id} />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Selector etiqueta="Estado" name="estado" defaultValue={envio.estado}>
                    {ESTADOS_ENVIO.map((e) => (
                      <option key={e} value={e}>
                        {etiquetaEnvio[e]}
                      </option>
                    ))}
                  </Selector>
                  <Campo
                    etiqueta="Cuándo"
                    name="ocurrido_en"
                    type="datetime-local"
                    defaultValue={fechaHoraLocal(new Date().toISOString())}
                  />
                  <Campo etiqueta="Lugar" name="ubicacion" placeholder="SJO Aeropuerto" />
                  <Campo etiqueta="Descripción" name="descripcion" placeholder="Documentos emitidos" />
                </div>
              </FormularioAccion>
            </div>
          </>
        )}
      </Bloque>

      {/* ── Borrar ─────────────────────────────────────────────────────── */}
      <form action={eliminarPedido} className="border border-linea bg-papel p-6">
        <input type="hidden" name="pedido_id" value={pedido.id} />
        <h2 className="titulo-3">Eliminar el pedido</h2>
        <p className="mt-2 max-w-xl text-sm text-pizarra">
          Borra el pedido, sus líneas, su envío y todos los movimientos. El cliente deja de verlo. No se puede
          deshacer.
        </p>
        <button className="mt-5 border border-red-800 px-5 py-2.5 text-sm text-red-800 transition-colors hover:bg-red-800 hover:text-papel">
          Eliminar
        </button>
      </form>
    </div>
  );
}
