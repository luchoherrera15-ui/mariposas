import type { Metadata } from "next";
import Link from "next/link";
import CuentaEnRevision from "@/components/panel/CuentaEnRevision";
import { BarraProgreso, Chip, Estadistica, Tarjeta, Vacio } from "@/components/ui";
import {
  calcularResumen,
  mariposasPorEspecie,
  obtenerImpacto,
  obtenerPedidos,
  obtenerUsuario,
} from "@/lib/datos";
import { colorEnvio, colorPedido, progresoEnvio } from "@/lib/formato";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { calcularAportes } from "@/lib/impacto";
import { ESTADOS_COTIZACION } from "@/lib/tipos";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).panel.resumen.metaTitulo };
}

export default async function PanelResumen() {
  const [usuario, todos, proyectos, t, { fecha, moneda, numero }] = await Promise.all([
    obtenerUsuario(),
    obtenerPedidos(),
    obtenerImpacto(),
    obtenerTextos(),
    obtenerFormato(),
  ]);
  const r = t.panel.resumen;
  const pedidos = todos.filter((p) => !ESTADOS_COTIZACION.includes(p.estado));
  const porResponder = todos.filter((p) => p.estado === "cotizado");

  const saludo = (
    <div>
      <h1 className="titulo-2">{fmt(r.hola, { nombre: usuario?.nombre?.split(" ")[0] ?? r.clienteGenerico })}</h1>
      <p className="mt-1 text-pizarra">{r.subtitulo}</p>
      {porResponder.map((p) => (
        <Link
          key={p.id}
          href={`/panel/cotizaciones/${p.id}`}
          className="mt-5 flex flex-wrap items-center gap-3 border-l-2 border-morpho bg-nube px-4 py-3 text-sm hover:bg-nube/70"
        >
          <span className="datos font-semibold">{p.codigo}</span>
          <span>{t.estadosPedido.cotizado}</span>
          <span className="ml-auto font-medium text-morpho">{t.cotizaciones.ver} →</span>
        </Link>
      ))}
    </div>
  );

  if (!usuario?.aprobado) {
    return (
      <div className="space-y-8">
        {saludo}
        <CuentaEnRevision />
      </div>
    );
  }

  const resumen = calcularResumen(pedidos);
  const especies = mariposasPorEspecie(pedidos, r.sinEspecie);
  const aportes = calcularAportes(resumen.mariposas, proyectos);
  const enCamino = pedidos.filter((p) => p.envio && p.envio.estado !== "entregado");
  const maximo = especies[0]?.cantidad ?? 1;

  return (
    <div className="space-y-8">
      {saludo}

      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Estadistica etiqueta={r.compradas} valor={numero(resumen.mariposas)} detalle={r.acumulado} />
        <Estadistica etiqueta={r.pedidos} valor={numero(resumen.pedidos)} detalle={r.desdePrimero} />
        <Estadistica
          etiqueta={r.enviosCurso}
          valor={numero(resumen.enTransito)}
          detalle={r.conTracking}
          acento="morpho"
        />
        <Estadistica
          etiqueta={r.invertido}
          valor={moneda(resumen.invertido, resumen.moneda)}
          detalle={r.sinFlete}
          acento="hoja"
        />
      </div>

      {/* Impacto generado por este cliente */}
      <Tarjeta fondo="bg-noche" className="text-white">
        <p className="text-xs font-semibold text-morpho">{r.tuImpacto}</p>
        <h2 className="mt-2 titulo-2">{fmt(r.seConvirtieron, { n: numero(resumen.mariposas) })}</h2>
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
          {r.verImpacto}
        </Link>
      </Tarjeta>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Envíos en camino */}
        <Tarjeta>
          <div className="flex items-center justify-between">
            <h2 className="titulo-3">{r.enCamino}</h2>
            <Link href="/panel/envios" className="text-sm font-medium text-morpho hover:text-tinta">
              {r.verTodos}
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {enCamino.length === 0 ? (
              <p className="text-sm text-pizarra">{r.sinEnvios}</p>
            ) : (
              enCamino.map((p) => (
                <Link
                  key={p.id}
                  href={`/panel/envios/${p.envio!.id}`}
                  className="block border border-linea p-4 transition hover:border-tinta"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="datos font-semibold text-tinta">{p.codigo}</p>
                    <Chip className={colorEnvio[p.envio!.estado]}>{t.estadosEnvio[p.envio!.estado]}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-pizarra">
                    {p.envio!.origen} → {p.envio!.destino}
                  </p>
                  <div className="mt-3">
                    <BarraProgreso porcentaje={progresoEnvio(p.envio!.estado)} className="bg-morpho" />
                  </div>
                  <p className="mt-2 text-xs text-pizarra">
                    {r.entregaEstimada} <span className="datos">{fecha(p.envio!.entrega_estimada)}</span>
                  </p>
                </Link>
              ))
            )}
          </div>
        </Tarjeta>

        {/* Mariposas por especie */}
        <Tarjeta>
          <h2 className="titulo-3">{r.porEspecie}</h2>
          {especies.length === 0 ? (
            <p className="mt-4 text-sm text-pizarra">{r.sinCompras}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {especies.map((e) => (
                <li key={e.nombre}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-tinta">{e.nombre}</span>
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
          <h2 className="titulo-3">{r.ultimosPedidos}</h2>
          <Link href="/panel/pedidos" className="text-sm font-medium text-morpho hover:text-tinta">
            {r.verTodos}
          </Link>
        </div>
        {pedidos.length === 0 ? (
          <div className="mt-4">
            <Vacio>{r.sinPedidos}</Vacio>
          </div>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-y border-linea text-left text-xs text-pizarra">
                  <th className="px-5 py-2.5 font-semibold">{r.pedido}</th>
                  <th className="px-5 py-2.5 font-semibold">{r.fecha}</th>
                  <th className="px-5 py-2.5 text-right font-semibold">{r.mariposas}</th>
                  <th className="px-5 py-2.5 text-right font-semibold">{r.total}</th>
                  <th className="px-5 py-2.5 font-semibold">{r.estado}</th>
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
                      <Chip className={colorPedido[p.estado]}>{t.estadosPedido[p.estado]}</Chip>
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
