import type { Metadata } from "next";
import Link from "next/link";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { obtenerPedidos } from "@/lib/datos";
import { colorPedido } from "@/lib/formato";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { ESTADOS_COTIZACION } from "@/lib/tipos";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).cotizaciones.metaTitulo };
}

export default async function PanelCotizaciones() {
  const [pedidos, t, { fecha, moneda, numero }] = await Promise.all([obtenerPedidos(), obtenerTextos(), obtenerFormato()]);
  const tc = t.cotizaciones;
  const cotizaciones = pedidos.filter((p) => ESTADOS_COTIZACION.includes(p.estado));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo-2">{tc.titulo}</h1>
          <p className="mt-1 text-pizarra">{tc.subtitulo}</p>
        </div>
        <Link href="/especies" className="bg-tinta px-5 py-2.5 text-sm text-papel transition-colors hover:bg-morpho">
          + {tc.nueva}
        </Link>
      </div>

      {cotizaciones.length === 0 ? (
        <Vacio>{tc.vacio}</Vacio>
      ) : (
        <ul className="space-y-3">
          {cotizaciones.map((p) => {
            const pupas = p.items.reduce((s, i) => s + i.cantidad, 0);
            return (
              <li key={p.id}>
                <Link href={`/panel/cotizaciones/${p.id}`} className="block transition-colors hover:[&>div]:border-tinta">
                  <Tarjeta className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="datos font-semibold">{p.codigo}</span>
                    <Chip className={colorPedido[p.estado]}>{t.estadosPedido[p.estado]}</Chip>
                    <span className="text-sm text-pizarra">
                      {fmt(t.cotizar.resumen, { especies: p.items.length, pupas: numero(pupas) })}
                    </span>
                    <span className="datos text-sm text-pizarra">{fmt(tc.solicitada, { fecha: fecha(p.creado_en) })}</span>
                    <span className="datos ml-auto font-semibold">
                      {p.estado === "solicitado" ? tc.porConfirmar : moneda(p.total, p.moneda)}
                    </span>
                  </Tarjeta>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
