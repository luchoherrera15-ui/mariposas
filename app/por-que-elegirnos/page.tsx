import type { Metadata } from "next";
import Link from "next/link";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { obtenerUsuario } from "@/lib/datos";
import { obtenerTextos } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.porQue.metaTitulo, description: t.porQue.metaDescripcion };
}

export default async function PorQueElegirnos() {
  const [t, usuario] = await Promise.all([obtenerTextos(), obtenerUsuario()]);
  const tp = t.porQue;

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[82rem] px-6 pb-20 pt-16">
          <h1 className="display max-w-4xl">{tp.titulo}</h1>
          <p className="lede mt-8 max-w-2xl">{tp.entradilla}</p>
        </div>

        {/* Lo que ofrecemos */}
        <section className="mx-auto w-full max-w-[82rem] px-6 pb-24">
          <h2 className="titulo-2">{tp.ventajasTitulo}</h2>
          <dl className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {tp.ventajas.map(([titulo, texto]) => (
              <div key={titulo} className="border-t border-linea pt-5">
                <dt className="titulo-3">{titulo}</dt>
                <dd className="mt-2 leading-relaxed text-pizarra">{texto}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* La plataforma */}
        <section className="bg-noche text-white">
          <div className="mx-auto max-w-[82rem] px-6 py-24">
            <div className="max-w-2xl">
              <h2 className="titulo-2">{tp.plataformaTitulo}</h2>
              <p className="prosa mt-5 text-white/65">{tp.plataformaTexto}</p>
            </div>
            <dl className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {tp.funciones.map(([titulo, texto]) => (
                <div key={titulo} className="border-t border-white/15 pt-5">
                  <dt className="text-[1.1rem]">{titulo}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/60">{texto}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Cómo se pide */}
        <section className="mx-auto w-full max-w-[82rem] px-6 py-24">
          <h2 className="titulo-2">{tp.pasosTitulo}</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {tp.pasos.map(([titulo, texto], i) => (
              <li key={titulo} className="border-t border-linea pt-5">
                <p className="datos text-sm text-morpho">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="titulo-3 mt-2">{titulo}</h3>
                <p className="mt-2 leading-relaxed text-pizarra">{texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Llamado */}
        <section className="border-t border-linea">
          <div className="mx-auto w-full max-w-[82rem] px-6 py-24">
            <h2 className="titulo-2">{tp.ctaTitulo}</h2>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link href="/especies" className="bg-tinta px-7 py-3.5 text-papel transition-colors hover:bg-morpho">
                {tp.ctaCotizar}
              </Link>
              {!usuario ? (
                <Link href="/entrar" className="border border-tinta px-7 py-3.5 transition-colors hover:bg-tinta hover:text-papel">
                  {tp.ctaCuenta}
                </Link>
              ) : null}
              <Link href="/visitas" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
                {tp.ctaVisita}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
