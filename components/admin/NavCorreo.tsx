"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const carpetas = [
  { clave: "entrada", texto: "Recibidos", href: "/admin/correo" },
  { clave: "enviados", texto: "Enviados", href: "/admin/correo?carpeta=enviados" },
  { clave: "archivo", texto: "Archivados", href: "/admin/correo?carpeta=archivo" },
] as const;

/** Columna izquierda del buzón, compartida por todas las pantallas de correo. */
export default function NavCorreo({ sinLeer }: { sinLeer: number }) {
  const ruta = usePathname();
  const carpeta = useSearchParams().get("carpeta") ?? "entrada";
  const enLista = ruta === "/admin/correo";

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/admin/correo/nuevo"
        className={`mb-3 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          ruta === "/admin/correo/nuevo" ? "bg-tinta text-papel" : "bg-morpho text-papel hover:bg-tinta"
        }`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        Redactar
      </Link>

      {carpetas.map((c) => {
        const activa = enLista && carpeta === c.clave;
        return (
          <Link
            key={c.clave}
            href={c.href}
            aria-current={activa ? "page" : undefined}
            className={`flex items-center justify-between px-3.5 py-2 text-sm transition-colors ${
              activa ? "bg-nube font-medium text-tinta" : "text-tinta/80 hover:bg-nube/60 hover:text-tinta"
            }`}
          >
            {c.texto}
            {c.clave === "entrada" && sinLeer ? <span className="datos text-xs font-semibold text-morpho">{sinLeer}</span> : null}
          </Link>
        );
      })}

      <div className="my-2 h-px bg-linea" />
      <Link
        href="/admin/correo/firma"
        aria-current={ruta === "/admin/correo/firma" ? "page" : undefined}
        className={`px-3.5 py-2 text-sm transition-colors ${
          ruta === "/admin/correo/firma" ? "bg-nube font-medium" : "text-tinta/80 hover:bg-nube/60 hover:text-tinta"
        }`}
      >
        Firma
      </Link>
    </nav>
  );
}
