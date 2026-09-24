"use client";

import Link from "next/link";
import { carrito, useCarrito } from "@/lib/carrito-cotizacion";

/** "Agregar a la cotización" en la ficha y en las tarjetas del catálogo. */
export default function BotonCotizar({
  slug,
  agregar,
  agregada,
  compacto = false,
}: {
  slug: string;
  agregar: string;
  agregada: string;
  compacto?: boolean;
}) {
  const lista = useCarrito();
  const esta = lista.some((l) => l.slug === slug);

  if (esta) {
    return (
      <Link
        href="/cotizar"
        className={
          compacto
            ? "inline-flex items-center gap-1.5 text-xs text-hoja hover:text-tinta"
            : "inline-flex items-center gap-2 border border-hoja px-6 py-3 text-sm text-hoja transition-colors hover:bg-hoja hover:text-papel"
        }
      >
        ✓ {agregada}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => carrito.agregar(slug)}
      className={
        compacto
          ? "inline-flex items-center gap-1.5 text-xs text-tinta underline decoration-linea underline-offset-4 hover:decoration-tinta"
          : "inline-flex items-center gap-2 bg-tinta px-6 py-3 text-sm text-papel transition-colors hover:bg-morpho"
      }
    >
      + {agregar}
    </button>
  );
}
