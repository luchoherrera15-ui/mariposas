import type { Metadata } from "next";
import { BarraProgreso, Estadistica, Tarjeta } from "@/components/ui";
import {
  calcularResumen,
  obtenerImpacto,
  obtenerPedidos,
  obtenerTotalMariposasVendidas,
} from "@/lib/datos";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { calcularAportes, textoRegla, unidadEn } from "@/lib/impacto";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).panel.impacto.metaTitulo };
}

export default async function PanelImpacto() {
  const [pedidos, proyectos, totalGlobal, t, { numero }] = await Promise.all([
    obtenerPedidos(),
    obtenerImpacto(),
    obtenerTotalMariposasVendidas(),
    obtenerTextos(),
    obtenerFormato(),
  ]);
  const ti = t.panel.impacto;

  const resumen = calcularResumen(pedidos);
  const aportes = calcularAportes(resumen.mariposas, proyectos);
  const cuota = totalGlobal > 0 ? (resumen.mariposas / totalGlobal) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">{ti.titulo}</h1>
        <p className="mt-1 max-w-2xl text-pizarra">
          {ti.subtituloAntes}{" "}
          <span className="datos font-semibold text-tinta">{numero(resumen.mariposas)}</span> {ti.subtituloDespues}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Estadistica etiqueta={ti.tusMariposas} valor={numero(resumen.mariposas)} detalle={ti.acumulado} />
        <Estadistica
          etiqueta={ti.delTotal}
          valor={`${numero(cuota, 1)}%`}
          detalle={fmt(ti.sobreTotal, { n: numero(totalGlobal) })}
          acento="morpho"
        />
        <Estadistica
          etiqueta={ti.proyectos}
          valor={numero(aportes.filter((a) => a.aporte > 0).length)}
          detalle={fmt(ti.deActivos, { n: aportes.length })}
          acento="hoja"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {aportes.map(({ proyecto, aporte, faltanParaLaSiguiente }) => {
          const proporcionGlobal = proyecto.ejecutado > 0 ? (aporte / proyecto.ejecutado) * 100 : 0;
          const unidadesBloque = proyecto.regla?.unidades_por_bloque ?? 0;
          return (
            <Tarjeta key={proyecto.id}>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="titulo-3">{proyecto.nombre}</h2>
                  <p className="datos mt-1 text-xs font-semibold text-morpho">{textoRegla(proyecto, t)}</p>
                </div>
              </div>

              <p className="datos mt-5 datos text-[2.2rem] leading-none">
                {numero(aporte)} <span className="text-lg font-normal text-pizarra">{proyecto.unidad}</span>
              </p>
              <p className="mt-1 text-sm text-pizarra">{ti.gracias}</p>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-pizarra">
                  <span>{ti.tuParte}</span>
                  <span className="datos">
                    {fmt(ti.deTotal, {
                      p: numero(proporcionGlobal, 1),
                      n: numero(proyecto.ejecutado),
                      unidad: proyecto.unidad,
                    })}
                  </span>
                </div>
                <BarraProgreso porcentaje={proporcionGlobal} className="bg-morpho" />
              </div>

              <p className="mt-4 bg-lino px-4 py-3 text-sm text-pizarra">
                {fmt(ti.faltan, {
                  n: numero(faltanParaLaSiguiente),
                  mariposas: faltanParaLaSiguiente === 1 ? t.comun.mariposa : t.comun.mariposas,
                  u: numero(unidadesBloque, 2),
                  unidad: unidadEn(unidadesBloque, proyecto),
                })}
              </p>
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta fondo="bg-nube">
        <h2 className="titulo-3">{ti.comoTitulo}</h2>
        <p className="mt-2 text-sm text-pizarra">{ti.comoTexto}</p>
      </Tarjeta>
    </div>
  );
}
