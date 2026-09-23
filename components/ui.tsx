import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Superficie del panel: blanca, con filete, sin sombras ni esquinas blandas. */
export function Tarjeta({
  children,
  className = "",
  fondo = "bg-papel",
}: {
  children: ReactNode;
  className?: string;
  /**
   * Va aparte de `className` a propósito: dos utilidades de background tienen
   * la misma especificidad y gana la que Tailwind emita de último, no la que
   * se escriba después en el atributo.
   */
  fondo?: string;
}) {
  return <div className={`border border-linea p-6 ${fondo} ${className}`}>{children}</div>;
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>
  );
}

export function Estadistica({
  etiqueta,
  valor,
  detalle,
  acento = "tinta",
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  acento?: "tinta" | "morpho" | "hoja";
}) {
  const color = { tinta: "text-tinta", morpho: "text-morpho", hoja: "text-hoja" }[acento];
  return (
    <Tarjeta>
      <p className="text-sm text-pizarra">{etiqueta}</p>
      <p className={`datos mt-3 text-[1.9rem] leading-none ${color}`}>{valor}</p>
      {detalle ? <p className="mt-2 text-sm text-pizarra">{detalle}</p> : null}
    </Tarjeta>
  );
}

export function BarraProgreso({
  porcentaje,
  className = "bg-tinta",
}: {
  porcentaje: number;
  className?: string;
}) {
  const valor = Math.max(0, Math.min(100, porcentaje));
  return (
    <div
      className="h-px w-full bg-linea"
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-px transition-all ${className}`} style={{ width: `${valor}%` }} />
    </div>
  );
}

export function Boton({
  children,
  variante = "principal",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: "principal" | "secundario" }) {
  return (
    <button className={`${clasesBoton(variante)} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function BotonEnlace({
  children,
  href,
  variante = "principal",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variante?: "principal" | "secundario";
  className?: string;
}) {
  return (
    <Link href={href} className={`${clasesBoton(variante)} ${className}`}>
      {children}
    </Link>
  );
}

function clasesBoton(variante: "principal" | "secundario") {
  const base =
    "inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-colors disabled:opacity-60";
  return variante === "principal"
    ? `${base} bg-tinta text-papel hover:bg-morpho`
    : `${base} border border-linea hover:border-tinta`;
}

export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-linea p-8 text-center text-sm text-pizarra">{children}</div>
  );
}
