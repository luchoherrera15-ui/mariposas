"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/pedidos", texto: "Pedidos" },
  { href: "/admin/clientes", texto: "Clientes" },
  { href: "/admin/correo", texto: "Correo" },
  { href: "/admin/visitas", texto: "Visitas" },
  { href: "/admin/especies", texto: "Catálogo" },
  { href: "/admin/impacto", texto: "Compromiso ambiental" },
  { href: "/admin/ajustes", texto: "Textos del sitio" },
];

export default function NavAdmin() {
  const ruta = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {enlaces.map((e) => {
        const activo = e.href === "/admin" ? ruta === "/admin" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap px-3.5 py-2.5 text-sm transition-colors ${
              activo ? "bg-tinta text-papel" : "text-tinta/75 hover:bg-nube hover:text-tinta"
            }`}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
