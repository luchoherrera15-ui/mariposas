"use client";

import { useActionState, type ReactNode } from "react";
import type { Resultado } from "@/app/admin/acciones";

/**
 * Envoltorio de formulario para las acciones del panel: maneja el estado
 * pendiente y muestra el resultado sin que cada página lo repita.
 */
export default function FormularioAccion({
  accion,
  children,
  boton = "Guardar",
  className = "",
  compacto = false,
}: {
  accion: (previo: Resultado, formulario: FormData) => Promise<Resultado>;
  children: ReactNode;
  boton?: string;
  className?: string;
  /** Botón en línea con los campos, para formularios de una sola fila. */
  compacto?: boolean;
}) {
  const [estado, enviar, pendiente] = useActionState(accion, null);

  return (
    <form action={enviar} className={className}>
      {children}

      <div className={compacto ? "mt-4 flex flex-wrap items-center gap-4" : "mt-5 flex flex-wrap items-center gap-4"}>
        <button
          type="submit"
          disabled={pendiente}
          className="bg-tinta px-5 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-morpho disabled:opacity-60"
        >
          {pendiente ? "Guardando…" : boton}
        </button>

        {estado?.error ? <p className="text-sm text-red-800">{estado.error}</p> : null}
        {estado?.ok ? <p className="text-sm text-hoja">{estado.ok}</p> : null}
      </div>
    </form>
  );
}
