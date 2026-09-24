import type { Metadata } from "next";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { obtenerImpacto, obtenerRegistrosImpacto } from "@/lib/datos";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { avanceMeta, textoRegla } from "@/lib/impacto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.impacto.metaTitulo, description: t.impacto.metaDescripcion };
}

/**
 * Compromiso con la naturaleza. Mientras no haya siembras registradas en
 * /admin/impacto se muestra la regla y "próximamente", sin cifras: los
 * números aparecen solos cuando se carga la primera siembra real.
 */
export default async function Impacto() {
  const [proyectos, registros, t, { fecha, numero }] = await Promise.all([
    obtenerImpacto(),
    obtenerRegistrosImpacto(),
    obtenerTextos(),
    obtenerFormato(),
  ]);
  const ti = t.impacto;

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[76rem] flex-1 px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="display">{ti.titulo}</h1>
          <p className="lede mt-7">{ti.entradilla}</p>
          {registros.length === 0 ? (
            <p className="datos mt-8 inline-block border border-hoja px-3 py-1.5 text-sm text-hoja">{ti.proximamente}</p>
          ) : null}
        </div>

        {/* La regla de cada proyecto; las cifras solo si ya hay siembras. */}
        <ul className="mt-20 divide-y divide-linea border-y border-linea">
          {proyectos.map((p) => {
            const avance = p.ejecutado > 0 ? avanceMeta(p.ejecutado, p.meta_anual) : null;
            return (
              <li key={p.id} className="grid gap-6 py-10 lg:grid-cols-[1fr_18rem] lg:items-start lg:gap-12">
                <div>
                  <h2 className="titulo-2">{p.nombre}</h2>
                  <p className="datos mt-3 text-lg text-morpho">{textoRegla(p, t)}</p>
                  {p.descripcion ? <p className="prosa mt-4 max-w-2xl text-pizarra">{p.descripcion}</p> : null}
                </div>

                {p.ejecutado > 0 ? (
                  <div>
                    <p className="datos text-[1.9rem] leading-none">
                      {numero(p.ejecutado)} <span className="text-base text-pizarra">{p.unidad}</span>
                    </p>
                    <p className="mt-1.5 text-sm text-pizarra">{ti.ejecutado}</p>
                    {avance !== null ? (
                      <div className="mt-4">
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="datos">{avance} %</span>
                          <span className="text-pizarra">{fmt(ti.meta, { n: numero(p.meta_anual ?? 0) })}</span>
                        </div>
                        <div className="mt-2 h-px w-full bg-linea">
                          <div className="h-px bg-hoja" style={{ width: `${avance}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="datos text-sm text-hoja lg:text-right">{ti.proximamente}</p>
                )}
              </li>
            );
          })}
        </ul>

        {/* Cómo lo hacemos */}
        <section className="mt-24">
          <h2 className="titulo-2">{ti.comoTitulo}</h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {ti.pasos.map((paso, i) => (
              <li key={paso} className="border-t border-linea pt-5">
                <p className="datos text-sm text-morpho">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 leading-relaxed">{paso}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Registro de siembras */}
        <section className="mt-24">
          <h2 className="titulo-2">{ti.bitacora}</h2>
          {registros.length === 0 ? (
            <p className="mt-6 border border-dashed border-linea p-8 text-pizarra">{ti.sinRegistros}</p>
          ) : (
            <>
              <p className="prosa mt-4 text-pizarra">{ti.bitacoraTexto}</p>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead>
                    <tr className="border-y border-linea text-pizarra">
                      <th className="py-3 pr-6 font-normal">{ti.fecha}</th>
                      <th className="py-3 pr-6 font-normal">{ti.proyecto}</th>
                      <th className="py-3 pr-6 font-normal">{ti.detalle}</th>
                      <th className="py-3 text-right font-normal">{ti.cantidad}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linea">
                    {registros.map((r) => (
                      <tr key={r.id}>
                        <td className="datos whitespace-nowrap py-3.5 pr-6 text-pizarra">{fecha(r.fecha)}</td>
                        <td className="py-3.5 pr-6">{r.proyecto}</td>
                        <td className="py-3.5 pr-6 text-pizarra">{r.detalle}</td>
                        <td className="datos whitespace-nowrap py-3.5 text-right">
                          {numero(r.cantidad)} {r.unidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
