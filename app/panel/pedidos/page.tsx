import type { Metadata } from "next";
import Link from "next/link";
import CuentaEnRevision from "@/components/panel/CuentaEnRevision";
import { Chip, Tarjeta, Vacio } from "@/components/ui";
import { obtenerPedidos, obtenerUsuario } from "@/lib/datos";
import { colorEnvio, colorPedido } from "@/lib/formato";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).panel.pedidos.metaTitulo };
}

export default async function PanelPedidos() {
  const [usuario, pedidos, t, { fecha, moneda, numero }] = await Promise.all([
    obtenerUsuario(),
    obtenerPedidos(),
    obtenerTextos(),
    obtenerFormato(),
  ]);
  const tp = t.panel.pedidos;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo-2">{tp.titulo}</h1>
        <p className="mt-1 text-pizarra">{tp.subtitulo}</p>
      </div>

      {!usuario?.aprobado ? (
        <CuentaEnRevision />
      ) : pedidos.length === 0 ? (
        <Vacio>{tp.vacio}</Vacio>
      ) : (
        pedidos.map((p) => {
          const mariposas = p.items.reduce((s, i) => s + i.cantidad, 0);
          return (
            <Tarjeta key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="datos text-lg">{p.codigo}</h2>
                    <Chip className={colorPedido[p.estado]}>{t.estadosPedido[p.estado]}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-pizarra">
                    <span className="datos">{fecha(p.creado_en)}</span>
                    {p.notas ? ` · ${p.notas}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="datos text-2xl">{moneda(p.total, p.moneda)}</p>
                  <p className="datos text-sm text-pizarra">{fmt(tp.nMariposas, { n: numero(mariposas) })}</p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto border border-linea">
                <table className="w-full min-w-[30rem] text-sm">
                  <thead>
                    <tr className="border-b border-linea bg-lino text-left text-xs text-pizarra">
                      <th className="px-4 py-2.5 font-semibold">{tp.especie}</th>
                      <th className="px-4 py-2.5 text-right font-semibold">{tp.cantidad}</th>
                      <th className="px-4 py-2.5 text-right font-semibold">{tp.precio}</th>
                      <th className="px-4 py-2.5 text-right font-semibold">{tp.subtotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map((i) => (
                      <tr key={i.id} className="border-b border-linea/60 last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-tinta">{i.especie?.nombre_comun}</span>
                          <span className="ml-2 text-xs italic text-pizarra">{i.especie?.nombre_cientifico}</span>
                        </td>
                        <td className="datos px-4 py-2.5 text-right text-pizarra">{numero(i.cantidad)}</td>
                        <td className="datos px-4 py-2.5 text-right text-pizarra">
                          {moneda(i.precio_unitario, p.moneda)}
                        </td>
                        <td className="datos px-4 py-2.5 text-right font-semibold text-tinta">
                          {moneda(i.cantidad * i.precio_unitario, p.moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {p.envio ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 bg-lino px-4 py-3">
                  <Chip className={colorEnvio[p.envio.estado]}>{t.estadosEnvio[p.envio.estado]}</Chip>
                  <p className="text-sm text-pizarra">
                    {p.envio.transportista}
                    {p.envio.numero_guia ? ` · ${p.envio.numero_guia}` : ""}
                  </p>
                  <Link
                    href={`/panel/envios/${p.envio.id}`}
                    className="ml-auto text-sm font-semibold text-morpho hover:text-tinta"
                  >
                    {tp.verTracking}
                  </Link>
                </div>
              ) : (
                <p className="mt-4 bg-lino px-4 py-3 text-sm text-pizarra">{tp.sinEnvio}</p>
              )}
            </Tarjeta>
          );
        })
      )}
    </div>
  );
}
