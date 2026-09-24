import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AvisoDemo from "@/components/AvisoDemo";
import Foto from "@/components/Foto";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TarjetaEspecie from "@/components/TarjetaEspecie";
import BotonCotizar from "@/components/cotizacion/BotonCotizar";
import { obtenerMarca } from "@/lib/ajustes";
import { obtenerEspecie, obtenerEspecies } from "@/lib/datos";
import { slugDeEspecie } from "@/lib/especies-foto";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerTextos } from "@/lib/i18n/servidor";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const especie = await obtenerEspecie((await params).slug);
  if (!especie) return {};
  return {
    title: `${especie.nombre_comun} (${especie.nombre_cientifico})`,
    description: especie.descripcion ?? undefined,
  };
}

export default async function FichaEspecie({ params }: Props) {
  const { slug } = await params;
  const [especie, todas, marca, t] = await Promise.all([
    obtenerEspecie(slug),
    obtenerEspecies(),
    obtenerMarca(),
    obtenerTextos(),
  ]);
  if (!especie) notFound();
  const te = t.especies;

  const parientes = todas.filter((e) => e.familia === especie.familia && e.id !== especie.id).slice(0, 4);
  const asunto = encodeURIComponent(fmt(te.asuntoConsulta, { especie: `${especie.nombre_comun} (${especie.nombre_cientifico})` }));

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[82rem] px-6 pt-10">
          <Link href="/especies" className="text-sm text-pizarra transition-colors hover:text-tinta">
            ← {te.volver}
          </Link>
        </div>

        <article className="mx-auto grid max-w-[82rem] items-start gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Foto
            slug={slugDeEspecie(especie.nombre_cientifico)}
            alt={`${especie.nombre_comun} (${especie.nombre_cientifico})`}
            className="aspect-[4/3] w-full"
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
            textoVacio={te.sinFoto}
          />

          <div>
            {especie.familia === "Saturniidae" ? (
              <p className="datos text-xs uppercase tracking-wider text-morpho">{te.polilla}</p>
            ) : null}
            <h1 className="titulo-2 mt-1">{especie.nombre_comun}</h1>
            <p className="cientifico mt-2 text-lg text-pizarra">{especie.nombre_cientifico}</p>
            {especie.descripcion ? <p className="prosa mt-6 text-pizarra">{especie.descripcion}</p> : null}

            <dl className="mt-8 divide-y divide-linea border-y border-linea">
              <Dato etiqueta={te.familia} valor={especie.familia} />
              <Dato etiqueta={te.origen} valor={especie.region} />
              <Dato etiqueta={te.envergadura} valor={especie.envergadura} mono />
              <Dato etiqueta={te.vuelo} valor={especie.vuelo} />
              <Dato etiqueta={te.disponibilidad} valor={especie.disponibilidad} />
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <BotonCotizar slug={especie.slug} agregar={t.cotizar.agregar} agregada={t.cotizar.agregada} />
              <a
                href={`mailto:${marca.correo}?subject=${asunto}`}
                className="border-b border-linea pb-0.5 text-sm text-pizarra transition-colors hover:border-tinta hover:text-tinta"
              >
                {te.consultar}
              </a>
            </div>
          </div>
        </article>

        {parientes.length ? (
          <section className="border-t border-linea bg-papel">
            <div className="mx-auto max-w-[82rem] px-6 py-20">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 className="titulo-3">{fmt(te.masFamilia, { familia: especie.familia ?? "" })}</h2>
                <Link
                  href={`/especies?familia=${encodeURIComponent(especie.familia ?? "")}`}
                  className="border-b border-linea pb-0.5 text-sm transition-colors hover:border-tinta"
                >
                  {te.volver}
                </Link>
              </div>
              <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {parientes.map((e) => (
                  <li key={e.id}>
                    <TarjetaEspecie
                      especie={e}
                      textoVacio={te.sinFoto}
                      polilla={te.polilla}
                      cotizar={{ agregar: t.cotizar.agregar, agregada: t.cotizar.agregada }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </>
  );
}

function Dato({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string | null; mono?: boolean }) {
  if (!valor) return null;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="text-sm text-pizarra">{etiqueta}</dt>
      <dd className={mono ? "datos text-[0.95rem]" : "text-right text-[1.02rem]"}>{valor}</dd>
    </div>
  );
}
