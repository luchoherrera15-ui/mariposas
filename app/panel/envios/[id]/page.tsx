import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CuentaEnRevision from "@/components/panel/CuentaEnRevision";
import LineaTiempo from "@/components/panel/LineaTiempo";
import { BarraProgreso, Chip, Tarjeta } from "@/components/ui";
import { obtenerPedidos, obtenerUsuario } from "@/lib/datos";
import { colorEnvio, progresoEnvio } from "@/lib/formato";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).panel.detalle.metaTitulo };
}

export default async function DetalleEnvio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [usuario, pedidos, t, formato] = await Promise.all([
    obtenerUsuario(),
    obtenerPedidos(),
    obtenerTextos(),
    obtenerFormato(),
  ]);
  const td = t.panel.detalle;
  const { fecha, moneda, numero } = formato;

  if (!usuario?.aprobado) return <CuentaEnRevision />;

  const pedido = pedidos.find((p) => p.envio?.id === id);
  if (!pedido || !pedido.envio) notFound();

  const envio = pedido.envio;
  const mariposas = pedido.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div className="space-y-6">
      <Link href="/panel/envios" className="text-sm font-medium text-morpho hover:text-tinta">
        {td.todos}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="datos text-2xl">{pedido.codigo}</h1>
          <p className="mt-1 text-pizarra">
            {envio.origen} → {envio.destino}
          </p>
        </div>
        <Chip className={`${colorEnvio[envio.estado]} px-3.5 py-1.5 text-sm`}>{t.estadosEnvio[envio.estado]}</Chip>
      </div>

      <Tarjeta>
        <BarraProgreso
          porcentaje={progresoEnvio(envio.estado)}
          className={envio.estado === "entregado" ? "bg-tinta" : "bg-morpho"}
        />
        <div className="mt-3 flex justify-between gap-2 text-xs text-pizarra">
          {td.pasos.map((paso) => (
            <span key={paso}>{paso}</span>
          ))}
        </div>
      </Tarjeta>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Tarjeta>
          <h2 className="titulo-3">{td.historial}</h2>
          <div className="mt-5">
            <LineaTiempo
              eventos={envio.eventos ?? []}
              estados={t.estadosEnvio}
              vacio={td.sinMovimientos}
              fechaHora={formato.fechaHora}
            />
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <h2 className="titulo-3">{td.datos}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Fila etiqueta={td.transportista} valor={envio.transportista ?? "—"} />
              <Fila etiqueta={td.guia} valor={envio.numero_guia ?? td.porAsignar} />
              <Fila etiqueta={td.despachado} valor={fecha(envio.enviado_en)} />
              <Fila
                etiqueta={envio.entregado_en ? td.entregado : td.entregaEstimada}
                valor={fecha(envio.entregado_en ?? envio.entrega_estimada)}
              />
              <Fila
                etiqueta={td.cadenaFrio}
                valor={envio.temperatura_c === null ? "—" : `${envio.temperatura_c} °C`}
              />
            </dl>
            {envio.url_rastreo ? (
              <a
                href={envio.url_rastreo}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex border border-linea px-4 py-2 text-sm font-semibold text-tinta transition hover:border-tinta"
              >
                {td.rastrear}
              </a>
            ) : null}
          </Tarjeta>

          <Tarjeta>
            <h2 className="titulo-3">{td.contenido}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {pedido.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span className="text-tinta">{i.especie?.nombre_comun}</span>
                  <span className="datos font-semibold text-pizarra">{numero(i.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-linea pt-3 text-sm">
              <span className="font-semibold text-tinta">
                <span className="datos">{numero(mariposas)}</span> {td.mariposas}
              </span>
              <span className="datos font-semibold text-tinta">{moneda(pedido.total, pedido.moneda)}</span>
            </div>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-pizarra">{etiqueta}</dt>
      <dd className="datos text-right font-medium text-tinta">{valor}</dd>
    </div>
  );
}
