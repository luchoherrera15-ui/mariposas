import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Chip, Tarjeta } from "@/components/ui";
import { obtenerPedido } from "@/lib/datos";
import { colorPedido } from "@/lib/formato";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { ESTADOS_COMPRA } from "@/lib/tipos";
import { responderCotizacion } from "../acciones";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).cotizaciones.metaTitulo };
}

export default async function DetalleCotizacion({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const [{ id }, { nueva }] = await Promise.all([params, searchParams]);
  const [pedido, t, { fecha, moneda, numero }] = await Promise.all([obtenerPedido(id), obtenerTextos(), obtenerFormato()]);
  if (!pedido) notFound();
  const tc = t.cotizaciones;

  const conPrecios = pedido.estado !== "solicitado";
  const subtotal = pedido.items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
  const hoy = new Date().toISOString().slice(0, 10);
  const vencida = pedido.estado === "cotizado" && !!pedido.valida_hasta && pedido.valida_hasta < hoy;
  const aceptada = ESTADOS_COMPRA.includes(pedido.estado);

  return (
    <div className="space-y-6">
      <Link href="/panel/cotizaciones" className="text-sm font-medium text-morpho hover:text-tinta">
        ← {tc.titulo}
      </Link>

      {nueva ? <p className="border-l-2 border-hoja bg-nube px-4 py-3 text-sm">{tc.recibida}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <h1 className="datos text-2xl">{pedido.codigo}</h1>
        <Chip className={colorPedido[pedido.estado]}>{t.estadosPedido[pedido.estado]}</Chip>
        <span className="datos text-sm text-pizarra">{fmt(tc.solicitada, { fecha: fecha(pedido.creado_en) })}</span>
      </div>

      {pedido.estado === "solicitado" ? (
        <p className="text-pizarra">{tc.preparando}</p>
      ) : null}

      {pedido.respuesta ? (
        <Tarjeta fondo="bg-nube">
          <p className="text-xs font-semibold text-morpho">{tc.nota}</p>
          <p className="mt-2 whitespace-pre-line text-sm">{pedido.respuesta}</p>
        </Tarjeta>
      ) : null}

      <div className="overflow-x-auto border border-linea bg-papel">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-linea bg-lino text-left text-xs text-pizarra">
              <th className="px-4 py-2.5 font-semibold">{t.panel.pedidos.especie}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t.panel.pedidos.cantidad}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{tc.precioPorPupa}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{tc.subtotal}</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((i) => (
              <tr key={i.id} className="border-b border-linea/60">
                <td className="px-4 py-2.5">
                  <span className="font-medium">{i.especie?.nombre_comun}</span>
                  <span className="ml-2 text-xs italic text-pizarra">{i.especie?.nombre_cientifico}</span>
                </td>
                <td className="datos px-4 py-2.5 text-right">{numero(i.cantidad)}</td>
                <td className="datos px-4 py-2.5 text-right text-pizarra">
                  {conPrecios ? moneda(i.precio_unitario, pedido.moneda) : "—"}
                </td>
                <td className="datos px-4 py-2.5 text-right">
                  {conPrecios ? moneda(i.cantidad * i.precio_unitario, pedido.moneda) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          {conPrecios ? (
            <tfoot>
              {pedido.flete ? (
                <tr className="border-b border-linea/60">
                  <td className="px-4 py-2.5" colSpan={3}>{tc.flete}</td>
                  <td className="datos px-4 py-2.5 text-right">{moneda(pedido.flete, pedido.moneda)}</td>
                </tr>
              ) : null}
              <tr>
                <td className="px-4 py-3 font-semibold" colSpan={3}>{tc.total}</td>
                <td className="datos px-4 py-3 text-right text-lg font-semibold">
                  {moneda(subtotal + pedido.flete, pedido.moneda)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {/* Respuesta del cliente */}
      {pedido.estado === "cotizado" ? (
        vencida ? (
          <p className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">{tc.vencida}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <form action={responderCotizacion}>
              <input type="hidden" name="pedido_id" value={pedido.id} />
              <input type="hidden" name="decision" value="aceptar" />
              <button className="bg-tinta px-6 py-3 text-sm text-papel transition-colors hover:bg-morpho">{tc.aceptar}</button>
            </form>
            <form action={responderCotizacion}>
              <input type="hidden" name="pedido_id" value={pedido.id} />
              <input type="hidden" name="decision" value="rechazar" />
              <button className="border-b border-linea pb-0.5 text-sm text-pizarra hover:border-tinta hover:text-tinta">
                {tc.rechazar}
              </button>
            </form>
            {pedido.valida_hasta ? (
              <span className="datos text-sm text-pizarra">{fmt(tc.validaHasta, { fecha: fecha(pedido.valida_hasta) })}</span>
            ) : null}
          </div>
        )
      ) : null}
      {aceptada ? (
        <p className="border-l-2 border-hoja bg-nube px-4 py-3 text-sm">
          {tc.aceptada}{" "}
          <Link href="/panel/pedidos" className="underline">
            {tc.verPedido}
          </Link>
        </p>
      ) : null}
      {pedido.estado === "rechazado" ? <p className="text-sm text-pizarra">{tc.rechazadaTexto}</p> : null}

      {/* Lo que pidió */}
      <Tarjeta>
        <h2 className="titulo-3">{tc.tuSolicitud}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-pizarra">{tc.destino}</dt>
            <dd className="mt-0.5">{pedido.destino_pais ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-pizarra">{tc.fechaDeseada}</dt>
            <dd className="datos mt-0.5">{fecha(pedido.fecha_deseada)}</dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-xs text-pizarra">{tc.comentarios}</dt>
            <dd className="mt-0.5 whitespace-pre-line">{pedido.mensaje_cliente ?? "—"}</dd>
          </div>
        </dl>
      </Tarjeta>
    </div>
  );
}
