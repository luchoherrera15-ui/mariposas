import type { Metadata } from "next";
import Link from "next/link";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import TarjetaEspecie from "@/components/TarjetaEspecie";
import { leerPares, obtenerAjustes, obtenerMarca } from "@/lib/ajustes";
import { obtenerEspecies } from "@/lib/datos";
import { fmt } from "@/lib/i18n/idiomas";
import { obtenerTextos } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await obtenerTextos();
  return { title: t.especies.metaTitulo, description: t.especies.metaDescripcion };
}

export default async function Especies({ searchParams }: { searchParams: Promise<{ familia?: string }> }) {
  const [{ familia: pedida }, especies, ajustes, marca, t] = await Promise.all([
    searchParams,
    obtenerEspecies(),
    obtenerAjustes(),
    obtenerMarca(),
    obtenerTextos(),
  ]);
  const te = t.especies;
  const condiciones = leerPares(ajustes.envio_condiciones);

  // Familias con su cantidad, de la más numerosa a la menos.
  const porFamilia = new Map<string, number>();
  for (const e of especies) porFamilia.set(e.familia ?? "—", (porFamilia.get(e.familia ?? "—") ?? 0) + 1);
  const familias = [...porFamilia.entries()].sort((a, b) => b[1] - a[1]);
  const familia = pedida && porFamilia.has(pedida) ? pedida : null;
  const visibles = familia ? especies.filter((e) => (e.familia ?? "—") === familia) : especies;

  return (
    <>
      <AvisoDemo />
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[82rem] px-6 pb-10 pt-16">
          <div className="max-w-2xl">
            <h1 className="display">{fmt(te.titulo, { n: especies.length })}</h1>
            <p className="lede mt-8">{te.entradilla}</p>
          </div>

          {/* Filtro por familia */}
          <nav className="mt-12 flex flex-wrap gap-2 border-b border-linea pb-6 text-sm">
            <Filtro href="/especies" activo={!familia}>
              {te.todas} <span className="datos text-xs opacity-60">{especies.length}</span>
            </Filtro>
            {familias.map(([nombre, cantidad]) => (
              <Filtro key={nombre} href={`/especies?familia=${encodeURIComponent(nombre)}`} activo={familia === nombre}>
                {nombre} <span className="datos text-xs opacity-60">{cantidad}</span>
              </Filtro>
            ))}
          </nav>
          <p className="datos mt-4 text-sm text-pizarra">{fmt(te.cantidad, { n: visibles.length })}</p>
        </div>

        <ul className="mx-auto grid max-w-[82rem] gap-x-6 gap-y-12 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibles.map((e, indice) => (
            <li key={e.id}>
              <TarjetaEspecie
                especie={e}
                textoVacio={te.sinFoto}
                polilla={te.polilla}
                prioridad={indice < 4}
                cotizar={{ agregar: t.cotizar.agregar, agregada: t.cotizar.agregada }}
              />
            </li>
          ))}
        </ul>

        {/* Condiciones de envío */}
        <section className="bg-noche text-white">
          <div className="mx-auto grid max-w-[82rem] gap-12 px-6 py-24 lg:grid-cols-[24rem_1fr] lg:gap-20">
            <div>
              <h2 className="titulo-2">{te.comoViajan}</h2>
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
          <h2 className="titulo-2 max-w-2xl">{te.armamos}</h2>
          <div className="mt-8 flex flex-wrap gap-x-12 gap-y-4 text-[1.05rem]">
            <a href={`mailto:${marca.correo}`} className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
              {marca.correo}
            </a>
            <Link href="/entrar" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
              {te.yaCliente}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Filtro({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "page" : undefined}
      className={`px-3.5 py-1.5 transition-colors ${
        activo ? "bg-tinta text-papel" : "border border-linea text-tinta/80 hover:border-tinta hover:text-tinta"
      }`}
    >
      {children}
    </Link>
  );
}
