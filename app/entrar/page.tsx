import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerMarca } from "@/lib/ajustes";
import { modoDemo } from "@/lib/config";
import SelectorIdioma from "@/components/SelectorIdioma";
import { obtenerUsuario } from "@/lib/datos";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";
import FormularioEntrar from "./FormularioEntrar";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).entrar.metaTitulo };
}

export default async function Entrar() {
  const [usuario, marca, idioma, t] = await Promise.all([
    obtenerUsuario(),
    obtenerMarca(),
    obtenerIdioma(),
    obtenerTextos(),
  ]);
  if (usuario) redirect("/panel");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Formulario */}
      <div className="flex flex-col justify-center px-6 py-16 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="font-titulo text-[1.4rem] leading-none tracking-tight">
              {marca.nombre}
            </Link>
            <SelectorIdioma actual={idioma} etiqueta={t.idioma.etiqueta} />
          </div>

          <h1 className="titulo-2 mt-14">{t.entrar.titulo}</h1>
          <p className="mt-4 text-pizarra">
            {t.entrar.texto}
          </p>

          <div className="mt-10">
            <FormularioEntrar demo={modoDemo} t={t.entrar} />
          </div>

          <p className="mt-12 text-sm">
            <Link href="/" className="border-b border-linea pb-0.5 text-pizarra transition-colors hover:border-tinta hover:text-tinta">
              {t.entrar.volver}
            </Link>
          </p>
        </div>
      </div>

      {/* Foto */}
      <div className="relative hidden lg:block">
        <Image
          src="/fotos/cebra.jpg"
          alt={t.entrar.fotoAlt}
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <p className="absolute bottom-10 left-10 right-10 text-white">
          <span className="cientifico text-lg">Heliconius charithonia</span>
          <span className="mt-1 block text-sm text-white/70">
            {t.entrar.fotoTexto}
          </span>
        </p>
      </div>
    </div>
  );
}
