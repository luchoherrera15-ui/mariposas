"use client";

import { useEffect, useRef, useState } from "react";
import { cambiarIdioma } from "@/lib/i18n/acciones";
import { IDIOMAS, NOMBRE_IDIOMA, type Idioma } from "@/lib/i18n/idiomas";

/**
 * Selector de idioma del encabezado. Cada opción es un botón de un formulario
 * con Server Action: guarda la cookie y Next vuelve a pintar la página en el
 * idioma nuevo, sin recargar ni cambiar la URL.
 */
export default function SelectorIdioma({
  actual,
  etiqueta,
  sobreFoto = false,
}: {
  actual: Idioma;
  etiqueta: string;
  sobreFoto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // Cierra al hacer clic afuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  const boton = sobreFoto
    ? "text-white/80 hover:text-white"
    : "text-pizarra hover:text-tinta";

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`${etiqueta}: ${NOMBRE_IDIOMA[actual]}`}
        className={`datos flex items-center gap-1.5 py-2 text-[0.8rem] uppercase tracking-wider transition-colors ${boton}`}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M1.5 8h13M8 1.5c1.8 2 2.6 4.1 2.6 6.5S9.8 12.5 8 14.5M8 1.5C6.2 3.5 5.4 5.6 5.4 8s.8 4.5 2.6 6.5" />
        </svg>
        {actual}
      </button>

      {abierto ? (
        <form
          action={cambiarIdioma}
          onSubmit={() => setAbierto(false)}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-40 border border-linea bg-papel py-1 text-tinta shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {IDIOMAS.map((idioma) => (
            <button
              key={idioma}
              type="submit"
              name="idioma"
              value={idioma}
              role="menuitemradio"
              aria-checked={idioma === actual}
              lang={idioma}
              className={`flex w-full items-center justify-between gap-4 px-4 py-2 text-left text-sm transition-colors hover:bg-nube ${
                idioma === actual ? "font-medium" : "text-pizarra"
              }`}
            >
              {NOMBRE_IDIOMA[idioma]}
              <span className="datos text-[0.7rem] uppercase text-pizarra">{idioma}</span>
            </button>
          ))}
        </form>
      ) : null}
    </div>
  );
}
