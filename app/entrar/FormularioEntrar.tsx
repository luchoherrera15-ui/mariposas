"use client";

import { useActionState, useState } from "react";
import { Boton } from "@/components/ui";
import { entrar, registrarse, type EstadoFormulario } from "./acciones";

const estadoInicial: EstadoFormulario = null;

export default function FormularioEntrar({ demo }: { demo: boolean }) {
  const [modo, setModo] = useState<"entrar" | "registro">("entrar");
  const accion = modo === "entrar" ? entrar : registrarse;
  const [estado, enviar, pendiente] = useActionState(accion, estadoInicial);

  return (
    <div>
      <div className="flex border-b border-linea">
        {(["entrar", "registro"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            aria-pressed={modo === m}
            className={`-mb-px border-b-2 px-1 pb-3 pr-6 text-sm transition-colors ${
              modo === m ? "border-tinta text-tinta" : "border-transparent text-pizarra hover:text-tinta"
            }`}
          >
            {m === "entrar" ? "Ya tengo cuenta" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form action={enviar} className="mt-8 space-y-5">
        {modo === "registro" ? (
          <Campo etiqueta="Nombre o empresa" name="nombre" type="text" autoComplete="organization" />
        ) : null}
        <Campo etiqueta="Correo" name="email" type="email" autoComplete="email" required />
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          required
        />

        {estado?.error ? (
          <p className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">{estado.error}</p>
        ) : null}
        {estado?.aviso ? (
          <p className="border-l-2 border-hoja bg-nube px-4 py-3 text-sm">{estado.aviso}</p>
        ) : null}

        <Boton type="submit" disabled={pendiente} className="w-full">
          {pendiente ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear mi cuenta"}
        </Boton>
      </form>

      {demo ? (
        <p className="mt-6 border-l-2 border-linea pl-4 text-xs leading-relaxed text-pizarra">
          El sitio está en modo demostración: cualquier botón te lleva al panel con datos de ejemplo. Configurá
          Supabase en <code className="datos">.env.local</code> para usar cuentas reales.
        </p>
      ) : null}
    </div>
  );
}

function Campo({
  etiqueta,
  name,
  ...props
}: { etiqueta: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <input
        name={name}
        className="mt-2 w-full border border-linea bg-papel px-4 py-3 text-sm outline-none transition-colors focus:border-tinta"
        {...props}
      />
    </label>
  );
}
