import type { Metadata } from "next";
import Image from "next/image";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { creditos } from "@/lib/fotos";
import { obtenerTextos } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.creditos.metaTitulo, description: t.creditos.metaDescripcion };
}

export default async function Creditos() {
  const t = await obtenerTextos();
  const filas = Object.entries(creditos);

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[62rem] flex-1 px-6 py-16">
        <h1 className="titulo-2 max-w-2xl">{t.creditos.titulo}</h1>
        <p className="prosa mt-6 text-pizarra">
          {t.creditos.texto}
        </p>

        <ul className="mt-14 divide-y divide-linea border-y border-linea">
          {filas.map(([slug, credito]) => (
            <li key={slug} className="flex flex-wrap items-center gap-6 py-5">
              <div className="marco-foto relative h-20 w-28 shrink-0">
                <Image
                  src={`/fotos/${slug}.jpg`}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[1.05rem]">{credito.autor}</p>
                <p className="mt-1 text-sm text-pizarra">{credito.titulo}</p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-pizarra">{credito.licencia}</span>
                <a
                  href={credito.origen}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-linea pb-0.5 transition-colors hover:border-tinta"
                >
                  {t.creditos.origen}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <SiteFooter />
    </>
  );
}
