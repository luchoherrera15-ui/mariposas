import type { Metadata } from "next";
import Image from "next/image";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { creditos } from "@/lib/fotos";

export const metadata: Metadata = {
  title: "Créditos de las fotografías",
  description: "Autoría y licencia de cada fotografía usada en el sitio.",
};

export default function Creditos() {
  const filas = Object.entries(creditos);

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="mx-auto w-full max-w-[62rem] flex-1 px-6 py-16">
        <h1 className="titulo-2 max-w-2xl">Créditos de las fotografías</h1>
        <p className="prosa mt-6 text-pizarra">
          Las fotos de este sitio vienen de Wikimedia Commons y se usan bajo licencias Creative Commons y libres,
          que exigen atribuir al autor. Cuando la empresa tenga fotos propias, se reemplazan y esta página deja de
          hacer falta.
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
                  Origen
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
