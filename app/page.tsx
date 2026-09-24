import Image from "next/image";
import Link from "next/link";
import AvisoDemo from "@/components/AvisoDemo";
import Foto from "@/components/Foto";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { leerPasos, obtenerAjustes, obtenerMarca } from "@/lib/ajustes";
import {
  obtenerEspecies,
  obtenerImpacto,
  obtenerRegistrosImpacto,
} from "@/lib/datos";
import { slugDeEspecie } from "@/lib/especies-foto";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import { textoRegla } from "@/lib/impacto";

export default async function Inicio() {
  const [especies, proyectos, registros, ajustes, marca, t, { fecha, numero }] = await Promise.all([
    obtenerEspecies(),
    obtenerImpacto(),
    obtenerRegistrosImpacto(),
    obtenerAjustes(),
    obtenerMarca(),
    obtenerTextos(),
    obtenerFormato(),
  ]);

  const ciclo = leerPasos(ajustes.ciclo_pasos);

  // Las marcadas como destacadas en /admin/especies; si no hay, las primeras.
  const marcadas = especies.filter((e) => e.destacada);
  const destacadas = (marcadas.length ? marcadas : especies).slice(0, 4);
  const conReglas = proyectos.filter((p) => p.regla);

  return (
    <>
      <AvisoDemo />

      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <div className="relative">
        <SiteHeader sobreFoto />
        <section className="relative flex h-[92vh] min-h-[34rem] items-end overflow-hidden">
          <Image
            src="/fotos/portada.jpg"
            alt={t.inicio.portadaAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Dos velos: el lateral oscurece el lado del texto y deja vivo el
              ala a la derecha; el inferior asienta los botones. */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/65 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          <div className="relative mx-auto w-full max-w-[82rem] px-6 pb-16 text-white">
            <h1 className="display entra max-w-4xl" style={{ animationDelay: "0.1s" }}>
              {ajustes.inicio_titular}
            </h1>
            <p
              className="lede entra mt-7 max-w-xl text-white/90"
              style={{ animationDelay: "0.28s" }}
            >
              {ajustes.inicio_entradilla}
            </p>
            <div
              className="entra mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 text-[0.95rem]"
              style={{ animationDelay: "0.44s" }}
            >
              <Link href="/especies" className="bg-white px-7 py-3.5 text-tinta transition-colors hover:bg-white/85">
                {t.inicio.verEspecies}
              </Link>
              <Link href="/entrar" className="border-b border-white/40 pb-0.5 transition-colors hover:border-white">
                {t.inicio.entrarPanel}
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Cifras ──────────────────────────────────────────────────────── */}
      <section className="border-b border-linea">
        <dl className="mx-auto grid max-w-[82rem] divide-y divide-linea px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { n: ajustes.cifra1_valor, t: ajustes.cifra1_texto },
            { n: ajustes.cifra2_valor, t: ajustes.cifra2_texto },
            { n: ajustes.cifra3_valor, t: ajustes.cifra3_texto },
          ].map((c, i) => (
            <div key={c.t} className={`py-8 ${i > 0 ? "sm:pl-10" : ""} ${i < 2 ? "sm:pr-10" : ""}`}>
              <dd className="datos text-[2.3rem] leading-none">{c.n}</dd>
              <dt className="mt-2.5 text-sm text-pizarra">{c.t}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Catálogo ────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[82rem] px-6 py-24">
        <div className="grid gap-8 lg:grid-cols-[28rem_1fr] lg:items-end lg:gap-20">
          <h2 className="titulo-2">{t.inicio.masPedidas}</h2>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-md text-pizarra">
              {t.inicio.cotizacion}
            </p>
            <Link
              href="/especies"
              className="border-b border-linea pb-0.5 text-sm transition-colors hover:border-tinta"
            >
              {fmt(t.inicio.verTodas, { n: especies.length })}
            </Link>
          </div>
        </div>

        <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {destacadas.map((e) => {
            return (
              <li key={e.id}>
                <Link href={`/especies/${e.slug}`} className="group block">
                  <div className="relative">
                    <Foto
                      slug={slugDeEspecie(e.nombre_cientifico)}
                      alt={`${e.nombre_comun} (${e.nombre_cientifico})`}
                      className="aspect-[3/4] w-full"
                    />
                    {/* El nombre va sobre la foto: la ficha de abajo queda para
                        el dato técnico, que es lo que compara un mariposario. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-14 text-white">
                      <h3 className="titulo-3">{e.nombre_comun}</h3>
                      <p className="cientifico mt-0.5 text-sm text-white/75">{e.nombre_cientifico}</p>
                    </div>
                  </div>
                  {e.envergadura || e.disponibilidad ? (
                    <dl className="mt-4 space-y-2 text-sm">
                      {e.envergadura ? (
                        <div className="flex justify-between gap-3 border-t border-linea pt-3">
                          <dt className="text-pizarra">{t.inicio.envergadura}</dt>
                          <dd className="datos">{e.envergadura}</dd>
                        </div>
                      ) : null}
                      {e.disponibilidad ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-pizarra">{t.inicio.disponibilidad}</dt>
                          <dd>{e.disponibilidad}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Ciclo ───────────────────────────────────────────────────────── */}
      <section className="border-y border-linea bg-papel">
        <div className="mx-auto grid max-w-[82rem] gap-12 px-6 py-24 lg:grid-cols-[24rem_1fr] lg:gap-20">
          <div>
            <h2 className="titulo-2">{ajustes.ciclo_titulo}</h2>
            <p className="prosa mt-6 text-pizarra">{ajustes.ciclo_texto}</p>
          </div>
          <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {ciclo.map((paso) => (
              <li key={paso.dia} className="border-t border-linea pt-5">
                <p className="datos text-sm text-morpho">{fmt(t.inicio.dia, { n: paso.dia })}</p>
                <h3 className="titulo-3 mt-2">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-pizarra">{paso.detalle}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Trabajo social ──────────────────────────────────────────────── */}
      <section className="bg-noche text-white">
        <div className="mx-auto max-w-[82rem] px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[26rem_1fr] lg:gap-20">
            <div>
              <h2 className="titulo-2">
                {t.inicio.socialTituloAntes} <span className="italic">{t.inicio.socialTituloDestacado}</span>{" "}
                {t.inicio.socialTituloDespues}
              </h2>
              <p className="prosa mt-6 text-white/65">
                {t.inicio.socialTexto}
              </p>
              <Link
                href="/impacto"
                className="mt-8 inline-block border-b border-white/40 pb-0.5 text-sm transition-colors hover:border-white"
              >
                {t.inicio.verBitacora}
              </Link>
            </div>

            <div>
              <ul className="divide-y divide-white/15 border-y border-white/15">
                {conReglas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                    <span className="text-[1.05rem]">{p.nombre}</span>
                    <span className="datos text-sm text-white/55">{textoRegla(p, t)}</span>
                  </li>
                ))}
              </ul>

              <h3 className="titulo-3 mt-14">{t.inicio.ultimoEjecutado}</h3>
              <table className="mt-5 w-full text-sm">
                <tbody className="divide-y divide-white/15 border-t border-white/15">
                  {registros.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td className="datos whitespace-nowrap py-3.5 pr-6 text-white/50">{fecha(r.fecha)}</td>
                      <td className="py-3.5 pr-6 text-white/85">{r.detalle}</td>
                      <td className="datos whitespace-nowrap py-3.5 text-right">
                        {numero(r.cantidad)} {r.unidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[82rem] px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[26rem_1fr] lg:gap-20">
          <div>
            <h2 className="titulo-2">{t.inicio.panelTitulo}</h2>
            <Link
              href="/entrar"
              className="mt-8 inline-block bg-tinta px-7 py-3.5 text-papel transition-colors hover:bg-morpho"
            >
              {t.inicio.entrarAlPanel}
            </Link>
          </div>
          <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            {t.inicio.panelPuntos.map(([titulo, d]) => (
              <div key={titulo} className="border-t border-linea pt-5">
                <dt className="text-[1.05rem]">{titulo}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-pizarra">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Contacto ────────────────────────────────────────────────────── */}
      <section className="border-t border-linea">
        <div className="mx-auto w-full max-w-[82rem] px-6 py-24">
          <h2 className="titulo-2 max-w-3xl">
            {t.inicio.contactoTitulo}
          </h2>
          <div className="mt-10 flex flex-wrap gap-x-14 gap-y-4 text-[1.05rem]">
            <a
              href={`mailto:${marca.correo}`}
              className="border-b border-linea pb-0.5 transition-colors hover:border-tinta"
            >
              {marca.correo}
            </a>
            <span className="datos text-pizarra">{marca.telefono}</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
