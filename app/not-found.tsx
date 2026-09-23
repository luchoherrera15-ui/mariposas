import Link from "next/link";
import { obtenerTextos } from "@/lib/i18n/servidor";

export default async function NoEncontrado() {
  const t = await obtenerTextos();
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-32">
      <div className="mx-auto w-full max-w-[62rem]">
        <p className="datos text-sm text-pizarra">{t.noEncontrado.error}</p>
        <h1 className="titulo-2 mt-4 max-w-xl">{t.noEncontrado.titulo}</h1>
        <p className="prosa mt-5 text-pizarra">
          {t.noEncontrado.texto}
        </p>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-[1.05rem]">
          <Link href="/" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
            {t.noEncontrado.inicio}
          </Link>
          <Link href="/especies" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
            {t.noEncontrado.especies}
          </Link>
        </div>
      </div>
    </main>
  );
}
