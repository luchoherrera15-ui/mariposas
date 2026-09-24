import Link from "next/link";
import { obtenerMarca } from "@/lib/ajustes";
import { obtenerTextos } from "@/lib/i18n/servidor";

export default async function SiteFooter() {
  const [marca, t] = await Promise.all([obtenerMarca(), obtenerTextos()]);
  return (
    <footer className="mt-28 border-t border-linea">
      <div className="mx-auto grid max-w-[76rem] gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-titulo text-xl">{marca.nombre}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-pizarra">
            {marca.pie}
          </p>
        </div>

        <nav className="text-sm">
          <p className="text-pizarra">{t.pie.sitio}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/especies" className="transition-colors hover:text-morpho">
                {t.nav.especies}
              </Link>
            </li>
            <li>
              <Link href="/por-que-elegirnos" className="transition-colors hover:text-morpho">
                {t.nav.porQue}
              </Link>
            </li>
            <li>
              <Link href="/visitas" className="transition-colors hover:text-morpho">
                {t.nav.visitas}
              </Link>
            </li>
            <li>
              <Link href="/impacto" className="transition-colors hover:text-morpho">
                {t.nav.trabajoSocial}
              </Link>
            </li>
            <li>
              <Link href="/panel" className="transition-colors hover:text-morpho">
                {t.nav.panelClientes}
              </Link>
            </li>
            <li>
              <Link href="/creditos" className="transition-colors hover:text-morpho">
                {t.pie.creditos}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="text-pizarra">{t.pie.contacto}</p>
          <ul className="mt-3 space-y-2">
            <li>
              <a href={`mailto:${marca.correo}`} className="transition-colors hover:text-morpho">
                {marca.correo}
              </a>
            </li>
            {marca.telefonos.map((tel) => (
              <li key={tel} className="datos">
                <a href={`tel:${tel.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-morpho">
                  {tel}
                </a>
              </li>
            ))}
            <li className="text-pizarra">{marca.ubicacion}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[76rem] border-t border-linea px-6 py-5 text-xs text-pizarra">
        {t.pie.nota}
      </div>
    </footer>
  );
}
