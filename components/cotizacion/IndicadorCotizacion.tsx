"use client";

import Link from "next/link";
import { useCarrito } from "@/lib/carrito-cotizacion";

/** En el encabezado: aparece solo cuando hay especies en la cotización. */
export default function IndicadorCotizacion({ etiqueta, sobreFoto = false }: { etiqueta: string; sobreFoto?: boolean }) {
  const lista = useCarrito();
  if (!lista.length) return null;
  return (
    <Link
      href="/cotizar"
      className={`flex items-center gap-2 whitespace-nowrap text-[0.92rem] transition-colors ${
        sobreFoto ? "text-white hover:text-white/80" : "text-tinta hover:text-morpho"
      }`}
    >
      {etiqueta}
      <span className={`datos grid min-w-5 place-items-center rounded-full px-1.5 text-xs ${sobreFoto ? "bg-white text-tinta" : "bg-morpho text-papel"}`}>
        {lista.length}
      </span>
    </Link>
  );
}
