import type { Metadata } from "next";
import Link from "next/link";
import { Bloque, Campo, ESTADOS_PEDIDO, Selector } from "@/components/admin/campos";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { Chip } from "@/components/ui";
import { listarClientes, listarPedidos } from "@/lib/admin";
import { colorPedido, etiquetaPedido, fecha, moneda, numero } from "@/lib/formato";
import { crearPedido } from "../acciones";

export const metadata: Metadata = { title: "Pedidos" };

export default async function PedidosAdmin({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const [pedidos, clientes] = await Promise.all([listarPedidos(estado), listarClientes()]);
  const nombrePorId = new Map(clientes.map((c) => [c.id, c.nombre]));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="titulo-2">Pedidos</h1>
        <p className="mt-2 text-pizarra">
          Cada pedido que creés aparece de inmediato en el panel del cliente correspondiente.
        </p>
      </div>

      <Bloque titulo="Nuevo pedido">
        <FormularioAccion accion={crearPedido} boton="Crear pedido">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Selector etiqueta="Cliente" name="cliente_id" required defaultValue="">
              <option value="" disabled>
                Elegí un cliente
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.email})
                </option>
              ))}
            </Selector>
            <Selector etiqueta="Estado" name="estado" defaultValue="pendiente">
              {ESTADOS_PEDIDO.map((e) => (
                <option key={e} value={e}>
                  {etiquetaPedido[e]}
                </option>
              ))}
            </Selector>
            <Campo etiqueta="Moneda" name="moneda" defaultValue="USD" maxLength={3} />
            <Campo etiqueta="Nota interna" name="notas" placeholder="Exhibición de verano" />
          </div>
        </FormularioAccion>
      </Bloque>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/pedidos"
          className={`border px-3 py-1.5 transition-colors ${
            !estado ? "border-tinta bg-tinta text-papel" : "border-linea hover:border-tinta"
          }`}
        >
          Todos
        </Link>
        {ESTADOS_PEDIDO.map((e) => (
          <Link
            key={e}
            href={`/admin/pedidos?estado=${e}`}
            className={`border px-3 py-1.5 transition-colors ${
              estado === e ? "border-tinta bg-tinta text-papel" : "border-linea hover:border-tinta"
            }`}
          >
            {etiquetaPedido[e]}
          </Link>
        ))}
      </div>

      {pedidos.length === 0 ? (
        <p className="border border-dashed border-linea p-8 text-center text-sm text-pizarra">
          No hay pedidos con ese estado.
        </p>
      ) : (
        <div className="overflow-x-auto border border-linea bg-papel">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-linea text-left text-pizarra">
                <th className="px-4 py-3 font-normal">Pedido</th>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 text-right font-normal">Mariposas</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
                <th className="px-4 py-3 font-normal">Estado</th>
                <th className="px-4 py-3 font-normal">Envío</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${p.id}`} className="datos hover:text-morpho">
                      {p.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{nombrePorId.get(p.cliente_id) ?? "—"}</td>
                  <td className="datos px-4 py-3 text-pizarra">{fecha(p.creado_en)}</td>
                  <td className="datos px-4 py-3 text-right">
                    {numero(p.items.reduce((s, i) => s + i.cantidad, 0))}
                  </td>
                  <td className="datos px-4 py-3 text-right">{moneda(p.total, p.moneda)}</td>
                  <td className="px-4 py-3">
                    <Chip className={colorPedido[p.estado]}>{etiquetaPedido[p.estado]}</Chip>
                  </td>
                  <td className="px-4 py-3 text-pizarra">
                    {p.envio ? (p.envio.numero_guia ?? "sin guía") : "sin envío"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
