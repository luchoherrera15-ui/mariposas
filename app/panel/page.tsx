import type { Metadata } from "next";
import Link from "next/link";
import { BarraProgreso, Chip, Estadistica, Tarjeta, Vacio } from "@/components/ui";
import {
  calcularResumen,
  mariposasPorEspecie,
  obtenerImpacto,
  obtenerPedidos,
  obtenerUsuario,
} from "@/lib/datos";
import {
  colorEnvio,
  colorPedido,
  etiquetaEnvio,
  etiquetaPedido,
  fecha,
  moneda,
  numero,
  progresoEnvio,
} from "@/lib/formato";
import { calcularAportes } from "@/lib/impacto";

export const metadata: Metadata = { title: "Resumen" };

export default async function PanelResumen() {
  const [usuario, pedidos, proyectos] = await Promise.all([
    obtenerUsuario(),
    obtenerPedidos(),
    obtenerImpacto(),
  ]);

  const resumen = calcularResumen(pedidos);
  const especies = mariposasPorEspecie(pedidos);
  const aportes = calcularAportes(resumen.mariposas, proyectos);
  const enCamino = pedidos.filter((p) => p.envio && p.envio.estado !== "entregado");
  const maximo = especies[0]?.cantidad ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">
          Hola, {usuario?.nombre?.split(" ")[0] ?? "cliente"}
        </h1>
        <p className="mt-1 text-pizarra">Este es el estado de tu cuenta y del trabajo social que generaste.</p>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estadistica etiqueta="Mariposas compradas" valor={numero(resumen.mariposas)} detalle="acumulado histórico" />
        <Estadistica etiqueta="Pedidos" valor={numero(resumen.pedidos)} detalle="desde tu primer pedido" />
        <Estadistica
          etiqueta="Envíos en curso"
          valor={numero(resumen.enTransito)}
          detalle="con tracking activo"
          acento="morpho"
        />
        <Estadistica
          etiqueta="Total invertido"
          valor={moneda(resumen.invertido, resumen.moneda)}
          detalle="sin flete ni permisos"
          acento="hoja"
        />
      </div>

      {/* Impacto generado por este cliente */}
      <Tarjeta fondo="bg-noche" className="text-white">
        <p className="text-xs font-semibold text-morpho">Tu impacto</p>
        <h2 className="mt-2 titulo-2">
          Tus {numero(resumen.mariposas)} mariposas se convirtieron en:
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {aportes.map(({ proyecto, aporte }) => (
            <div key={proyecto.id} className="border border-white/15 bg-lino/5 p-4">
              <p className="datos mt-2 titulo-2 text-white">{numero(aporte)}</p>
              <p className="text-xs text-white/70">{proyecto.unidad}</p>
              <p className="mt-2 text-xs leading-snug text-white/60">{proyecto.nombre}</p>
            </div>
          ))}
        </div>
        <Link
          href="/panel/impacto"
          className="mt-6 inline-flex text-sm font-semibold text-white/90 underline decoration-crema/30 underline-offset-4 hover:text-white"
        >
          Ver el detalle de mi impacto
        </Link>
      </Tarjeta>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Envíos en camino */}
        <Tarjeta>
          <div className="flex items-center justify-between">
            <h2 className="titulo-3">Envíos en camino</h2>
            <Link href="/panel/envios" className="text-sm font-medium text-morpho hover:text-tinta">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {enCamino.length === 0 ? (
              <p className="text-sm text-pizarra">No tenés envíos en curso ahora mismo.</p>
            ) : (
              enCamino.map((p) => (
                <Link
                  key={p.id}
                  href={`/panel/envios/${p.envio!.id}`}
                  className="block border border-linea p-4 transition hover:border-tinta"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="datos font-semibold text-tinta">{p.codigo}</p>
                    <Chip className={colorEnvio[p.envio!.estado]}>{etiquetaEnvio[p.envio!.estado]}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-pizarra">
                    {p.envio!.origen} → {p.envio!.destino}
                  </p>
                  <div className="mt-3">
                    <BarraProgreso porcentaje={progresoEnvio(p.envio!.estado)} className="bg-morpho" />
                  </div>
                  <p className="mt-2 text-xs text-pizarra">
                    Entrega estimada: <span className="datos">{fecha(p.envio!.entrega_estimada)}</span>
                  </p>
                </Link>
              ))
            )}
          </div>
        </Tarjeta>

        {/* Mariposas por especie */}
        <Tarjeta>
          <h2 className="titulo-3">Mariposas por especie</h2>
          {especies.length === 0 ? (
            <p className="mt-4 text-sm text-pizarra">Todavía no hay compras registradas.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {especies.map((e) => (
                <li key={e.nombre}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-tinta">
                      {e.nombre}
                    </span>
                    <span className="datos font-semibold text-pizarra">{numero(e.cantidad)}</span>
                  </div>
                  <div className="mt-1.5">
                    <BarraProgreso porcentaje={(e.cantidad / maximo) * 100} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      {/* Últimos pedidos */}
      <Tarjeta>
        <div className="flex items-center justify-between">
          <h2 className="titulo-3">Últimos pedidos</h2>
          <Link href="/panel/pedidos" className="text-sm font-medium text-morpho hover:text-tinta">
            Ver todos
          </Link>
        </div>
        {pedidos.length === 0 ? (
          <div className="mt-4">
            <Vacio>Todavía no hay pedidos en tu cuenta.</Vacio>
          </div>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-y border-linea text-left text-xs text-pizarra">
                  <th className="px-5 py-2.5 font-semibold">Pedido</th>
                  <th className="px-5 py-2.5 font-semibold">Fecha</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Mariposas</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-5 py-2.5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b border-linea/60 last:border-0">
                    <td className="datos px-5 py-3 font-semibold text-tinta">{p.codigo}</td>
                    <td className="datos whitespace-nowrap px-5 py-3 text-pizarra">{fecha(p.creado_en)}</td>
                    <td className="datos px-5 py-3 text-right text-pizarra">
                      {numero(p.items.reduce((s, i) => s + i.cantidad, 0))}
                    </td>
                    <td className="datos whitespace-nowrap px-5 py-3 text-right font-semibold text-tinta">
                      {moneda(p.total, p.moneda)}
                    </td>
                    <td className="px-5 py-3">
                      <Chip className={colorPedido[p.estado]}>{etiquetaPedido[p.estado]}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
