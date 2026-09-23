"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Textos } from "@/lib/i18n/textos";

/** Con `completo` en false (cuenta sin aprobar) se esconden Pedidos y Envíos. */
export default function NavPanel({ textos, completo }: { textos: Textos["panel"]["nav"]; completo: boolean }) {
  const ruta = usePathname();
  const enlaces = [
    { href: "/panel", texto: textos.resumen },
    ...(completo
      ? [
          { href: "/panel/pedidos", texto: textos.pedidos },
          { href: "/panel/envios", texto: textos.envios },
        ]
      : []),
    { href: "/panel/impacto", texto: textos.impacto },
  ];

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
