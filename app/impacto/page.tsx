import type { Metadata } from "next";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { obtenerAjustes } from "@/lib/ajustes";
import { obtenerImpacto, obtenerRegistrosImpacto } from "@/lib/datos";
import { fecha, numero } from "@/lib/formato";
import { avanceMeta, textoRegla } from "@/lib/impacto";

export const metadata: Metadata = {
  title: "Trabajo social",
  description: "La regla que convierte cada mariposa vendida en semillas, árboles, bosque conservado y empleo rural.",
};

export default async function Impacto() {
  const [proyectos, registros, ajustes] = await Promise.all([
    obtenerImpacto(),
    obtenerRegistrosImpacto(),
    obtenerAjustes(),
  ]);

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[76rem] flex-1 px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="display">Dónde termina la plata de cada mariposa.</h1>
          <p className="lede mt-7">
            Publicamos tres cosas: la regla de conversión, cuánto se ejecutó y con quién. Si una cifra no tiene
            respaldo documentado, no aparece acá. La base de cálculo son{" "}
            <span className="datos text-tinta">{ajustes.cifra1_valor}</span> mariposas vendidas.
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
                  <p className="datos mt-3 text-sm text-morpho">{textoRegla(p)}</p>
                </div>

                <div>
                  <p className="datos text-[1.9rem] leading-none">
                    {numero(p.ejecutado)}{" "}
                    <span className="text-base text-pizarra">{p.unidad}</span>
                  </p>
                  <p className="mt-1.5 text-sm text-pizarra">ejecutado y documentado</p>
                </div>

                {avance !== null ? (
                  <div>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="datos">{avance} %</span>
                      <span className="text-pizarra">
                        meta {numero(p.meta_anual ?? 0)}
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
          <h2 className="titulo-2">Bitácora</h2>
          <p className="prosa mt-4 text-pizarra">
            Cada línea es una entrega hecha, con la fecha y la contraparte. Los comprobantes se piden por correo.
          </p>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-y border-linea text-pizarra">
                  <th className="py-3 pr-6 font-normal">Fecha</th>
                  <th className="py-3 pr-6 font-normal">Proyecto</th>
                  <th className="py-3 pr-6 font-normal">Detalle</th>
                  <th className="py-3 text-right font-normal">Cantidad</th>
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
