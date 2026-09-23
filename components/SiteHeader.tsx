import Link from "next/link";
import { obtenerMarca } from "@/lib/ajustes";
import { obtenerUsuario } from "@/lib/datos";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";
import SelectorIdioma from "./SelectorIdioma";

/**
 * `sobreFoto` lo pone en blanco y flotando sobre la imagen del encabezado;
 * sin él es una barra sólida con filete, para las páginas interiores.
 */
export default async function SiteHeader({ sobreFoto = false }: { sobreFoto?: boolean }) {
  const [usuario, marca, idioma, t] = await Promise.all([
    obtenerUsuario(),
    obtenerMarca(),
    obtenerIdioma(),
    obtenerTextos(),
  ]);
  const enlaces = [
    { href: "/especies", texto: t.nav.especies },
    { href: "/impacto", texto: t.nav.trabajoSocial },
  ];

  const base = sobreFoto
    ? "absolute inset-x-0 top-0 z-40 text-white"
    : "sticky top-0 z-40 border-b border-linea bg-lino/90 backdrop-blur-sm";
  const apagado = sobreFoto ? "text-white/75 hover:text-white" : "text-pizarra hover:text-tinta";

  return (
    <header className={base}>
      <div className="mx-auto flex max-w-[82rem] items-center gap-4 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6">
        <Link href="/" className="font-titulo text-[1.05rem] leading-tight tracking-tight sm:text-[1.3rem]">
          {marca.nombre}
        </Link>

        <nav className="ml-auto flex items-center gap-4 text-[0.92rem] sm:gap-7">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className={`hidden transition-colors md:inline ${apagado}`}>
              {e.texto}
            </Link>
          ))}
          <Link
            href={usuario ? "/panel" : "/entrar"}
            className={
              sobreFoto
                ? "whitespace-nowrap border border-white/40 px-3 py-2 font-medium sm:px-4 transition-colors hover:border-white hover:bg-white hover:text-tinta"
                : "whitespace-nowrap border border-tinta px-3 py-2 font-medium sm:px-4 transition-colors hover:bg-tinta hover:text-papel"
            }
          >
            {usuario ? t.nav.miPanel : t.nav.panelClientes}
          </Link>
          <SelectorIdioma actual={idioma} etiqueta={t.idioma.etiqueta} sobreFoto={sobreFoto} />
        </nav>
      </div>
    </header>
  );
}
