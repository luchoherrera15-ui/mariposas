import Link from "next/link";
import { obtenerMarca } from "@/lib/ajustes";
import { obtenerUsuario } from "@/lib/datos";

const enlaces = [
  { href: "/especies", texto: "Especies" },
  { href: "/impacto", texto: "Trabajo social" },
];

/**
 * `sobreFoto` lo pone en blanco y flotando sobre la imagen del encabezado;
 * sin él es una barra sólida con filete, para las páginas interiores.
 */
export default async function SiteHeader({ sobreFoto = false }: { sobreFoto?: boolean }) {
  const [usuario, marca] = await Promise.all([obtenerUsuario(), obtenerMarca()]);

  const base = sobreFoto
    ? "absolute inset-x-0 top-0 z-40 text-white"
    : "sticky top-0 z-40 border-b border-linea bg-lino/90 backdrop-blur-sm";
  const apagado = sobreFoto ? "text-white/75 hover:text-white" : "text-pizarra hover:text-tinta";

  return (
    <header className={base}>
      <div className="mx-auto flex max-w-[82rem] items-baseline gap-8 px-6 py-6">
        <Link href="/" className="font-titulo text-[1.05rem] leading-tight tracking-tight sm:text-[1.3rem]">
          {marca.nombre}
        </Link>

        <nav className="ml-auto flex items-baseline gap-7 text-[0.92rem]">
          {enlaces.map((e) => (
            <Link key={e.href} href={e.href} className={`transition-colors ${apagado}`}>
              {e.texto}
            </Link>
          ))}
          <Link
            href={usuario ? "/panel" : "/entrar"}
            className={
              sobreFoto
                ? "border border-white/40 px-4 py-2 font-medium transition-colors hover:border-white hover:bg-white hover:text-tinta"
                : "border border-tinta px-4 py-2 font-medium transition-colors hover:bg-tinta hover:text-papel"
            }
          >
            {usuario ? "Mi panel" : "Panel de clientes"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
