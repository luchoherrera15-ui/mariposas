import Link from "next/link";
import { Chip } from "@/components/ui";
import { listarClientes, listarPedidos, resumenAdmin } from "@/lib/admin";
import { colorEnvio, colorPedido, etiquetaEnvio, etiquetaPedido, fecha, moneda, numero } from "@/lib/formato";

export default async function ResumenAdmin() {
  const [resumen, pedidos, clientes] = await Promise.all([resumenAdmin(), listarPedidos(), listarClientes()]);
  const nombrePorId = new Map(clientes.map((c) => [c.id, c.nombre]));
  const enCurso = pedidos.filter((p) => p.envio && p.envio.estado !== "entregado");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="titulo-2">Resumen</h1>
        <p className="mt-2 text-pizarra">
          Todo lo que cargues acá es lo que ve cada cliente en su panel.
        </p>
      </div>

      <dl className="grid gap-px border border-linea bg-linea sm:grid-cols-2 lg:grid-cols-5">
        {[
          { t: "Pedidos activos", v: numero(resumen.pedidos) },
          { t: "Por cobrar", v: numero(resumen.porCobrar) },
          { t: "Envíos en curso", v: numero(resumen.enCurso) },
          { t: "Mariposas vendidas", v: numero(resumen.mariposas) },
          { t: "Facturado", v: moneda(resumen.facturado) },
        ].map((c) => (
          <div key={c.t} className="bg-papel p-5">
            <dt className="text-sm text-pizarra">{c.t}</dt>
            <dd className="datos mt-2.5 text-[1.6rem] leading-none">{c.v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="titulo-3">Envíos en curso</h2>
          <Link href="/admin/pedidos" className="border-b border-linea pb-0.5 text-sm transition-colors hover:border-tinta">
            Ver todos los pedidos
          </Link>
        </div>

        {enCurso.length === 0 ? (
          <p className="mt-4 border border-dashed border-linea p-6 text-sm text-pizarra">
            No hay envíos en curso. Creá un pedido y cargale el envío.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border border-linea bg-papel">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-linea text-left text-pizarra">
                  <th className="px-4 py-3 font-normal">Pedido</th>
                  <th className="px-4 py-3 font-normal">Cliente</th>
                  <th className="px-4 py-3 font-normal">Ruta</th>
                  <th className="px-4 py-3 font-normal">Estado del envío</th>
                  <th className="px-4 py-3 font-normal">Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linea">
                {enCurso.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/pedidos/${p.id}`} className="datos hover:text-morpho">
                        {p.codigo}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{nombrePorId.get(p.cliente_id) ?? "—"}</td>
                    <td className="px-4 py-3 text-pizarra">
                      {p.envio?.origen} → {p.envio?.destino}
                    </td>
                    <td className="px-4 py-3">
                      <Chip className={colorEnvio[p.envio!.estado]}>{etiquetaEnvio[p.envio!.estado]}</Chip>
                    </td>
                    <td className="datos px-4 py-3 text-pizarra">{fecha(p.envio?.entrega_estimada ?? null)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="titulo-3">Últimos pedidos</h2>
        <div className="mt-4 overflow-x-auto border border-linea bg-papel">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-linea text-left text-pizarra">
                <th className="px-4 py-3 font-normal">Pedido</th>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Fecha</th>
                <th className="px-4 py-3 text-right font-normal">Mariposas</th>
                <th className="px-4 py-3 text-right font-normal">Total</th>
                <th className="px-4 py-3 font-normal">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {pedidos.slice(0, 8).map((p) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
