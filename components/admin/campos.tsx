import type { ReactNode } from "react";

/**
 * Campos del panel administrativo. Sin "use client": se renderizan en el
 * servidor y se pasan como hijos a <FormularioAccion>.
 */

const claseEntrada =
  "mt-1.5 w-full border border-linea bg-papel px-3 py-2 text-sm outline-none transition-colors focus:border-tinta disabled:bg-nube disabled:text-pizarra";

export function Campo({
  etiqueta,
  ayuda,
  className = "",
  ...props
}: { etiqueta: string; ayuda?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <input className={claseEntrada} {...props} />
      {ayuda ? <span className="mt-1 block text-xs text-pizarra">{ayuda}</span> : null}
    </label>
  );
}

export function Area({
  etiqueta,
  ayuda,
  className = "",
  ...props
}: { etiqueta: string; ayuda?: string | null } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <textarea rows={3} className={`${claseEntrada} resize-y leading-relaxed`} {...props} />
      {ayuda ? <span className="mt-1 block text-xs text-pizarra">{ayuda}</span> : null}
    </label>
  );
}

export function Selector({
  etiqueta,
  children,
  className = "",
  ...props
}: { etiqueta: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <select className={claseEntrada} {...props}>
        {children}
      </select>
    </label>
  );
}

export function Casilla({
  etiqueta,
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2.5 text-sm">
      <input type="checkbox" className="size-4 accent-[color:var(--color-tinta)]" {...props} />
      {etiqueta}
    </label>
  );
}

/** Bloque con título para agrupar campos dentro de una tarjeta. */
export function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border border-linea bg-papel p-6">
      <h2 className="titulo-3">{titulo}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export const ESTADOS_PEDIDO = [
  "solicitado",
  "cotizado",
  "rechazado",
  "pendiente",
  "confirmado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export const ESTADOS_ENVIO = [
  "preparando",
  "en_transito",
  "en_aduana",
  "en_reparto",
  "entregado",
  "incidencia",
] as const;
