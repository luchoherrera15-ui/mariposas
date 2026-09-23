import type { Metadata } from "next";
import { BarraProgreso, Estadistica, Tarjeta } from "@/components/ui";
import {
  calcularResumen,
  obtenerImpacto,
  obtenerPedidos,
  obtenerTotalMariposasVendidas,
} from "@/lib/datos";
import { numero } from "@/lib/formato";
import { calcularAportes, textoRegla, unidadEn } from "@/lib/impacto";

export const metadata: Metadata = { title: "Mi impacto social" };

export default async function PanelImpacto() {
  const [pedidos, proyectos, totalGlobal] = await Promise.all([
    obtenerPedidos(),
    obtenerImpacto(),
    obtenerTotalMariposasVendidas(),
  ]);

  const resumen = calcularResumen(pedidos);
  const aportes = calcularAportes(resumen.mariposas, proyectos);
  const cuota = totalGlobal > 0 ? (resumen.mariposas / totalGlobal) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">Mi impacto social</h1>
        <p className="mt-1 max-w-2xl text-pizarra">
          Esto es lo que generaron tus compras. Se calcula con la regla pública de cada proyecto sobre las{" "}
          <span className="datos font-semibold text-tinta">{numero(resumen.mariposas)}</span> mariposas que llevás
          compradas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Estadistica etiqueta="Tus mariposas" valor={numero(resumen.mariposas)} detalle="acumulado histórico" />
        <Estadistica
          etiqueta="Del total vendido"
          valor={`${cuota.toFixed(1)}%`}
          detalle={`sobre ${numero(totalGlobal)} mariposas`}
          acento="morpho"
        />
        <Estadistica
          etiqueta="Proyectos que financiás"
          valor={numero(aportes.filter((a) => a.aporte > 0).length)}
          detalle={`de ${aportes.length} activos`}
          acento="hoja"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {aportes.map(({ proyecto, aporte, faltanParaLaSiguiente }) => {
          const proporcionGlobal = proyecto.ejecutado > 0 ? (aporte / proyecto.ejecutado) * 100 : 0;
          return (
            <Tarjeta key={proyecto.id}>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="titulo-3">{proyecto.nombre}</h2>
                  <p className="datos mt-1 text-xs font-semibold text-morpho">
                    {textoRegla(proyecto)}
                  </p>
                </div>
              </div>

              <p className="datos mt-5 datos text-[2.2rem] leading-none">
                {numero(aporte)} <span className="text-lg font-normal text-pizarra">{proyecto.unidad}</span>
              </p>
              <p className="mt-1 text-sm text-pizarra">gracias a tus compras</p>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-pizarra">
                  <span>Tu parte del total ejecutado</span>
                  <span className="datos">
                    {proporcionGlobal.toFixed(1)}% de {numero(proyecto.ejecutado)} {proyecto.unidad}
                  </span>
                </div>
                <BarraProgreso porcentaje={proporcionGlobal} className="bg-morpho" />
              </div>

              <p className="mt-4 bg-lino px-4 py-3 text-sm text-pizarra">
                Con <span className="datos font-semibold text-tinta">{numero(faltanParaLaSiguiente)}</span>{" "}
                {faltanParaLaSiguiente === 1 ? "mariposa" : "mariposas"} más sumás{" "}
                {numero(proyecto.regla?.unidades_por_bloque ?? 0)}{" "}
                {unidadEn(proyecto.regla?.unidades_por_bloque ?? 0, proyecto.unidad)}.
              </p>
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta fondo="bg-nube">
        <h2 className="titulo-3">¿Cómo se calcula esto?</h2>
        <p className="mt-2 text-sm text-pizarra">
          Cada proyecto tiene una regla guardada en la base de datos con la forma{" "}
          <em>&quot;cada N mariposas vendidas = X unidades&quot;</em>. Tomamos tus mariposas compradas, aplicamos la
          regla de cada proyecto y mostramos el resultado. Los totales ejecutados que aparecen como referencia son los
          que publicamos con evidencia en la página de impacto.
        </p>
      </Tarjeta>
    </div>
  );
}
