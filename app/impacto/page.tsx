import type { Metadata } from "next";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { obtenerAjustes } from "@/lib/ajustes";
import { obtenerImpacto, obtenerRegistrosImpacto } from "@/lib/datos";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { avanceMeta, textoRegla } from "@/lib/impacto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.impacto.metaTitulo, description: t.impacto.metaDescripcion };
}

export default async function Impacto() {
  const [proyectos, registros, ajustes, t, { fecha, numero }] = await Promise.all([
    obtenerImpacto(),
    obtenerRegistrosImpacto(),
    obtenerAjustes(),
    obtenerTextos(),
    obtenerFormato(),
  ]);

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[76rem] flex-1 px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="display">{t.impacto.titulo}</h1>
          <p className="lede mt-7">
            {t.impacto.entradillaAntes} <span className="datos text-tinta">{ajustes.cifra1_valor}</span>{" "}
            {t.impacto.entradillaDespues}
          </p>
        </div>

        {/* Proyectos: la regla y el avance contra la meta */}
        <ul className="mt-20 divide-y divide-linea border-y border-linea">
          {proyectos.map((p) => {
            const avance = avanceMeta(p.ejecutado, p.meta_anual);
            return (
              <li key={p.id} className="grid gap-6 py-8 lg:grid-cols-[1fr_16rem_14rem] lg:items-start lg:gap-10">
                <div>
                  <h2 className="titulo-3">{p.nombre}</h2>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-pizarra">{p.descripcion}</p>
                  <p className="datos mt-3 text-sm text-morpho">{textoRegla(p, t)}</p>
                </div>

                <div>
                  <p className="datos text-[1.9rem] leading-none">
                    {numero(p.ejecutado)}{" "}
                    <span className="text-base text-pizarra">{p.unidad}</span>
                  </p>
                  <p className="mt-1.5 text-sm text-pizarra">{t.impacto.ejecutado}</p>
                </div>

                {avance !== null ? (
                  <div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="datos">{avance} %</span>
                      <span className="text-pizarra">
                        {fmt(t.impacto.meta, { n: numero(p.meta_anual ?? 0) })}
                      </span>
                    </div>
                    <div className="mt-2 h-px w-full bg-linea">
                      <div className="h-px bg-hoja" style={{ width: `${avance}%` }} />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* Bitácora */}
        <section className="mt-24">
          <h2 className="titulo-2">{t.impacto.bitacora}</h2>
          <p className="prosa mt-4 text-pizarra">
            {t.impacto.bitacoraTexto}
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-y border-linea text-pizarra">
                  <th className="py-3 pr-6 font-normal">{t.impacto.fecha}</th>
                  <th className="py-3 pr-6 font-normal">{t.impacto.proyecto}</th>
                  <th className="py-3 pr-6 font-normal">{t.impacto.detalle}</th>
                  <th className="py-3 text-right font-normal">{t.impacto.cantidad}</th>
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
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
