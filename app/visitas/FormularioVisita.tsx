"use client";

import { useActionState } from "react";
import { Boton } from "@/components/ui";
import type { Textos } from "@/lib/i18n/textos";
import { solicitarVisita, type EstadoVisita } from "./acciones";

/** Mismo orden que `visitas.opciones` en los textos. */
const INTERESES = ["instalaciones", "criaderos", "hospedaje", "tour", "negocios", "capacitacion", "arbol"] as const;

export default function FormularioVisita({
  t,
  inicial,
}: {
  t: Textos["visitas"];
  inicial: { nombre: string; empresa: string; email: string; pais: string };
}) {
  const [estado, enviar, enviando] = useActionState<EstadoVisita, FormData>(solicitarVisita, null);

  if (estado?.ok) {
    return <p className="border-l-2 border-hoja bg-nube px-5 py-4">{t.gracias}</p>;
  }

  return (
    <form action={enviar} className="space-y-4">
      {/* Trampa para bots: invisible y fuera del orden de tabulación. */}
      <input name="sitio_web" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Entrada etiqueta={t.nombre} name="nombre" defaultValue={inicial.nombre} required autoComplete="name" />
        <Entrada etiqueta={t.empresa} name="empresa" defaultValue={inicial.empresa} autoComplete="organization" />
        <Entrada etiqueta={t.correo} name="email" type="email" defaultValue={inicial.email} required autoComplete="email" />
        <Entrada etiqueta={t.pais} name="pais" defaultValue={inicial.pais} required autoComplete="country-name" />
        <Entrada etiqueta={t.fechas} name="fechas" placeholder={t.fechasAyuda} />
        <Entrada etiqueta={t.personas} name="personas" type="number" min={1} max={99} defaultValue={2} />
      </div>

      <fieldset>
        <legend className="text-sm text-pizarra">{t.intereses}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {INTERESES.map((clave, i) => (
            <label key={clave} className="flex cursor-pointer items-center gap-2.5 border border-linea bg-papel px-3 py-2 text-sm hover:border-tinta has-[:checked]:border-tinta">
              <input type="checkbox" name="intereses" value={clave} defaultChecked={clave === "instalaciones"} className="accent-[#111418]" />
              {t.opciones[i]?.[0]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm text-pizarra">{t.mensaje}</span>
        <textarea
          name="mensaje"
          rows={3}
          className="mt-1.5 w-full border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta"
        />
      </label>

      {estado?.error ? (
        <p className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">{estado.error}</p>
      ) : null}
      <Boton type="submit" disabled={enviando} className="w-full sm:w-auto">
        {enviando ? t.enviando : t.enviar}
      </Boton>
      <p className="text-xs text-pizarra">{t.nota}</p>
    </form>
  );
}

function Entrada({ etiqueta, ...props }: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <input
        className="mt-1.5 w-full border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta"
        {...props}
      />
    </label>
  );
}
