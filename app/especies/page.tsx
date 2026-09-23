import type { Metadata } from "next";
import Link from "next/link";
import AvisoDemo from "@/components/AvisoDemo";
import Foto from "@/components/Foto";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { leerPares, obtenerAjustes, obtenerMarca } from "@/lib/ajustes";
import { obtenerEspecies } from "@/lib/datos";
import { slugDeEspecie } from "@/lib/especies-foto";
import { ficha } from "@/lib/fichas";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.especies.metaTitulo, description: t.especies.metaDescripcion };
}

export default async function Especies() {
  const [especies, ajustes, marca, idioma, t] = await Promise.all([
    obtenerEspecies(),
    obtenerAjustes(),
    obtenerMarca(),
    obtenerIdioma(),
    obtenerTextos(),
  ]);
  const condiciones = leerPares(ajustes.envio_condiciones);

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[82rem] px-6 pb-16 pt-16">
          <div className="max-w-2xl">
            <h1 className="display">{t.especies.titulo}</h1>
            <p className="lede mt-8">
              {t.especies.entradilla}
            </p>
          </div>
        </div>

        {/* Fichas: foto grande alternando de lado, con los datos que pide un
            mariposario antes de comprar. */}
        <ul>
          {especies.map((e, indice) => {
            const f = ficha(e.nombre_cientifico, idioma);
            const invertida = indice % 2 === 1;
            return (
              <li key={e.id} className={indice % 2 === 0 ? "bg-lino" : "bg-papel"}>
                <div className="mx-auto grid max-w-[82rem] items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:gap-16">
                  <Foto
                    slug={slugDeEspecie(e.nombre_cientifico)}
                    alt={`${e.nombre_comun} (${e.nombre_cientifico})`}
                    className={`aspect-[3/2] w-full ${invertida ? "lg:order-2" : ""}`}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority={indice < 2}
                  />

                  <div className={invertida ? "lg:order-1" : ""}>
                    <p className="datos text-sm text-pizarra">
                      {String(indice + 1).padStart(2, "0")} / {String(especies.length).padStart(2, "0")}
                    </p>
                    <h2 className="titulo-2 mt-3">{e.nombre_comun}</h2>
                    <p className="cientifico mt-2 text-lg text-pizarra">{e.nombre_cientifico}</p>
                    <p className="prosa mt-6 text-pizarra">{e.descripcion}</p>

                    <dl className="mt-8 divide-y divide-linea border-y border-linea">
                      <Dato etiqueta={t.especies.familia} valor={e.familia ?? "—"} />
                      <Dato etiqueta={t.especies.origen} valor={e.region ?? "—"} />
                      {f ? <Dato etiqueta={t.especies.envergadura} valor={f.envergadura} mono /> : null}
                      {f ? <Dato etiqueta={t.especies.vuelo} valor={f.vuelo} /> : null}
                      {f ? <Dato etiqueta={t.especies.disponibilidad} valor={f.disponibilidad} /> : null}
                    </dl>

                    <a
                      href={`mailto:${marca.correo}?subject=${encodeURIComponent(fmt(t.especies.asuntoConsulta, { especie: e.nombre_comun }))}`}
                      className="mt-8 inline-block border-b border-linea pb-0.5 text-sm transition-colors hover:border-tinta"
                    >
                      {t.especies.consultar}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Condiciones de envío */}
        <section className="bg-noche text-white">
          <div className="mx-auto grid max-w-[82rem] gap-12 px-6 py-24 lg:grid-cols-[24rem_1fr] lg:gap-20">
            <div>
              <h2 className="titulo-2">{t.especies.comoViajan}</h2>
              <p className="prosa mt-6 text-white/65">{ajustes.envio_texto}</p>
            </div>
            <dl className="divide-y divide-white/15 border-y border-white/15">
              {condiciones.map((c) => (
                <div key={c.etiqueta} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <dt className="text-white/55">{c.etiqueta}</dt>
                  <dd className="text-[1.05rem]">{c.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[82rem] px-6 py-24">
          <h2 className="titulo-2 max-w-2xl">{t.especies.armamos}</h2>
          <div className="mt-8 flex flex-wrap gap-x-12 gap-y-4 text-[1.05rem]">
            <a
              href={`mailto:${marca.correo}`}
              className="border-b border-linea pb-0.5 transition-colors hover:border-tinta"
            >
              {marca.correo}
            </a>
            <Link href="/entrar" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
              {t.especies.yaCliente}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Dato({ etiqueta, valor, mono = false }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="text-sm text-pizarra">{etiqueta}</dt>
      <dd className={mono ? "datos text-[0.95rem]" : "text-[1.02rem]"}>{valor}</dd>
    </div>
  );
}
