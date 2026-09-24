import type { Metadata } from "next";
import Image from "next/image";
import AvisoDemo from "@/components/AvisoDemo";
import Foto from "@/components/Foto";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { obtenerUsuario } from "@/lib/datos";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import FormularioVisita from "./FormularioVisita";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.visitas.metaTitulo, description: t.visitas.metaDescripcion };
}

/** Fotos de apoyo (Wikimedia Commons, créditos en /creditos). */
const PAISAJES = [
  { slug: "visita-poas", alt: "Volcán Poás" },
  { slug: "visita-bosque", alt: "Monteverde" },
  { slug: "visita-cafe", alt: "Costa Rica" },
];

export default async function Visitas() {
  const [t, usuario] = await Promise.all([obtenerTextos(), obtenerUsuario()]);
  const tv = t.visitas;

  // Con sesión, el formulario viene completo con lo que ya sabemos.
  let inicial = { nombre: "", empresa: "", email: "", pais: "" };
  if (usuario && usuario.id !== "demo") {
    const { data } = await supabaseAdmin().from("perfiles").select("empresa, pais").eq("id", usuario.id).maybeSingle();
    inicial = {
      nombre: usuario.nombre,
      empresa: (data?.empresa as string) ?? "",
      email: usuario.email,
      pais: (data?.pais as string) ?? "",
    };
  }

  return (
    <>
      <AvisoDemo />
      <div className="relative">
        <SiteHeader sobreFoto />
        <section className="relative flex min-h-[34rem] items-end overflow-hidden sm:h-[78vh]">
          <Image src="/fotos/visita-selva.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          <div className="relative mx-auto w-full max-w-[82rem] px-6 pb-16 pt-40 text-white">
            <h1 className="display max-w-4xl">{tv.titulo}</h1>
            <p className="lede mt-7 max-w-xl text-white/90">{tv.entradilla}</p>
            <a href="#planear" className="mt-10 inline-block bg-white px-7 py-3.5 text-tinta transition-colors hover:bg-white/85">
              {tv.formTitulo}
            </a>
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* Qué se puede hacer */}
        <section className="mx-auto w-full max-w-[82rem] px-6 py-24">
          <h2 className="titulo-2 max-w-2xl">{tv.ofrecemosTitulo}</h2>
          <ol className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {tv.opciones.map(([titulo, texto], i) => (
              <li key={titulo} className="border-t border-linea pt-5">
                <p className="datos text-sm text-morpho">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="titulo-3 mt-2">{titulo}</h3>
                <p className="mt-2 leading-relaxed text-pizarra">{texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Paisajes */}
        <section className="mx-auto grid w-full max-w-[82rem] gap-4 px-6 sm:grid-cols-3">
          {PAISAJES.map((p) => (
            <Foto key={p.slug} slug={p.slug} alt={p.alt} className="aspect-[4/3] w-full" sizes="(min-width: 640px) 33vw, 100vw" />
          ))}
        </section>

        {/* Formulario */}
        <section id="planear" className="mx-auto grid w-full max-w-[82rem] scroll-mt-10 gap-12 px-6 py-24 lg:grid-cols-[22rem_1fr] lg:gap-20">
          <div>
            <h2 className="titulo-2">{tv.formTitulo}</h2>
            <p className="prosa mt-5 text-pizarra">{tv.formTexto}</p>
          </div>
          <FormularioVisita t={tv} inicial={inicial} />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
