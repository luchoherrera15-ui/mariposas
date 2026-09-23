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

export const metadata: Metadata = {
  title: "Especies",
  description: "Especies de mariposas tropicales que exportamos vivas en fase de pupa.",
};

export default async function Especies() {
  const [especies, ajustes, marca] = await Promise.all([obtenerEspecies(), obtenerAjustes(), obtenerMarca()]);
  const condiciones = leerPares(ajustes.envio_condiciones);

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[82rem] px-6 pb-16 pt-16">
          <div className="max-w-2xl">
            <h1 className="display">Ocho especies, todas de criaderos costarricenses.</h1>
            <p className="lede mt-8">
              Cada pedido se cotiza según especie, cantidad y destino. Escribinos con lo que necesitás y te
              confirmamos disponibilidad y fecha de vuelo en 24 horas.
            </p>
          </div>
        </div>

        {/* Fichas: foto grande alternando de lado, con los datos que pide un
            mariposario antes de comprar. */}
        <ul>
          {especies.map((e, indice) => {
            const f = ficha(e.nombre_cientifico);
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
                      <Dato etiqueta="Familia" valor={e.familia ?? "—"} />
                      <Dato etiqueta="Origen" valor={e.region ?? "—"} />
                      {f ? <Dato etiqueta="Envergadura" valor={f.envergadura} mono /> : null}
                      {f ? <Dato etiqueta="Vuelo" valor={f.vuelo} /> : null}
                      {f ? <Dato etiqueta="Disponibilidad" valor={f.disponibilidad} /> : null}
                    </dl>

                    <a
                      href={`mailto:${marca.correo}?subject=${encodeURIComponent(`Consulta: ${e.nombre_comun}`)}`}
                      className="mt-8 inline-block border-b border-linea pb-0.5 text-sm transition-colors hover:border-tinta"
                    >
                      Consultar disponibilidad de esta especie
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
              <h2 className="titulo-2">Cómo viajan</h2>
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
          <h2 className="titulo-2 max-w-2xl">¿Armamos tu pedido?</h2>
          <div className="mt-8 flex flex-wrap gap-x-12 gap-y-4 text-[1.05rem]">
            <a
              href={`mailto:${marca.correo}`}
              className="border-b border-linea pb-0.5 transition-colors hover:border-tinta"
            >
              {marca.correo}
            </a>
            <Link href="/entrar" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
              Si ya sos cliente, entrá al panel
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
