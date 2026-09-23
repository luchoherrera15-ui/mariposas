import Link from "next/link";
import { obtenerMarca } from "@/lib/ajustes";

export default async function SiteFooter() {
  const marca = await obtenerMarca();
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
          <p className="text-pizarra">Sitio</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/especies" className="transition-colors hover:text-morpho">
                Especies
              </Link>
            </li>
            <li>
              <Link href="/impacto" className="transition-colors hover:text-morpho">
                Trabajo social
              </Link>
            </li>
            <li>
              <Link href="/panel" className="transition-colors hover:text-morpho">
                Panel de clientes
              </Link>
            </li>
            <li>
              <Link href="/creditos" className="transition-colors hover:text-morpho">
                Créditos de las fotos
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="text-pizarra">Contacto</p>
          <ul className="mt-3 space-y-2">
            <li>
              <a href={`mailto:${marca.correo}`} className="transition-colors hover:text-morpho">
                {marca.correo}
              </a>
            </li>
            <li className="datos">{marca.telefono}</li>
            <li className="text-pizarra">{marca.ubicacion}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-[76rem] border-t border-linea px-6 py-5 text-xs text-pizarra">
        Sitio de demostración. Las cifras y los envíos son de ejemplo. Fotografías de Wikimedia Commons bajo licencias libres.
      </div>
    </footer>
  );
}
