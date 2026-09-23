import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LineaTiempo from "@/components/panel/LineaTiempo";
import { BarraProgreso, Chip, Tarjeta } from "@/components/ui";
import { obtenerPedidos } from "@/lib/datos";
import { colorEnvio, etiquetaEnvio, fecha, moneda, numero, progresoEnvio } from "@/lib/formato";

export const metadata: Metadata = { title: "Tracking del envío" };

export default async function DetalleEnvio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedidos = await obtenerPedidos();
  const pedido = pedidos.find((p) => p.envio?.id === id);
  if (!pedido || !pedido.envio) notFound();

  const envio = pedido.envio;
  const mariposas = pedido.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div className="space-y-6">
      <Link href="/panel/envios" className="text-sm font-medium text-morpho hover:text-tinta">
        Todos los envíos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="datos text-2xl">{pedido.codigo}</h1>
          <p className="mt-1 text-pizarra">
            {envio.origen} → {envio.destino}
          </p>
        </div>
        <Chip className={`${colorEnvio[envio.estado]} px-3.5 py-1.5 text-sm`}>{etiquetaEnvio[envio.estado]}</Chip>
      </div>

      <Tarjeta>
        <BarraProgreso
          porcentaje={progresoEnvio(envio.estado)}
          className={envio.estado === "entregado" ? "bg-tinta" : "bg-morpho"}
        />
        <div className="mt-3 flex justify-between text-xs text-pizarra">
          <span>Preparación</span>
          <span>Tránsito</span>
          <span>Aduana</span>
          <span>Reparto</span>
          <span>Entregado</span>
        </div>
      </Tarjeta>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Tarjeta>
          <h2 className="titulo-3">Historial de movimientos</h2>
          <div className="mt-5">
            <LineaTiempo eventos={envio.eventos ?? []} />
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <h2 className="titulo-3">Datos del envío</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Fila etiqueta="Transportista" valor={envio.transportista ?? "—"} />
              <Fila etiqueta="Número de guía" valor={envio.numero_guia ?? "Por asignar"} />
              <Fila etiqueta="Despachado" valor={fecha(envio.enviado_en)} />
              <Fila
                etiqueta={envio.entregado_en ? "Entregado" : "Entrega estimada"}
                valor={fecha(envio.entregado_en ?? envio.entrega_estimada)}
              />
              <Fila
                etiqueta="Cadena de frío"
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
                Rastrear con el transportista
              </a>
            ) : null}
          </Tarjeta>

          <Tarjeta>
            <h2 className="titulo-3">Contenido</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {pedido.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3">
                  <span className="text-tinta">
                    {i.especie?.nombre_comun}
                  </span>
                  <span className="datos font-semibold text-pizarra">{numero(i.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-linea pt-3 text-sm">
              <span className="font-semibold text-tinta">
                <span className="datos">{numero(mariposas)}</span> mariposas
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
