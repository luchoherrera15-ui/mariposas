"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/panel", texto: "Resumen" },
  { href: "/panel/pedidos", texto: "Pedidos" },
  { href: "/panel/envios", texto: "Envíos y tracking" },
  { href: "/panel/impacto", texto: "Mi impacto social" },
];

export default function NavPanel() {
  const ruta = usePathname();

  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {enlaces.map((e) => {
        const activo = e.href === "/panel" ? ruta === "/panel" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition ${
              activo ? "bg-noche text-white" : "text-tinta/75 hover:bg-nube hover:text-tinta"
            }`}
          >
            <span className="whitespace-nowrap">{e.texto}</span>
          </Link>
        );
      })}
    </nav>
  );
}
