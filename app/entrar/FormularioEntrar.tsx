"use client";

import { useActionState, useState } from "react";
import { Boton } from "@/components/ui";
import { fmt } from "@/lib/i18n/idiomas";
import type { Textos } from "@/lib/i18n/textos";
import { entrar, enviarCodigo, verificarCodigo, type EstadoFormulario } from "./acciones";

const estadoInicial: EstadoFormulario = null;

/**
 * Ingreso en dos pasos: correo → código de 6 dígitos que llega por correo.
 * "Crear cuenta" es el mismo camino con el nombre de la empresa. La
 * contraseña queda como alternativa para quien ya tenía una.
 */
export default function FormularioEntrar({ demo, t }: { demo: boolean; t: Textos["entrar"] }) {
  const [pestana, setPestana] = useState<"entrar" | "registro">("entrar");
  const [conContrasena, setConContrasena] = useState(false);
  // Respuesta que el usuario dejó atrás con "Usar otro correo".
  const [descartado, setDescartado] = useState<EstadoFormulario>(null);

  const [estadoPedido, pedir, pidiendo] = useActionState(enviarCodigo, estadoInicial);
  const [estadoCodigo, verificar, verificando] = useActionState(verificarCodigo, estadoInicial);
  const [estadoClave, entrarConClave, entrando] = useActionState(entrar, estadoInicial);

  // Cuando el servidor confirma que mandó el código, pasamos al segundo paso.
  const pendiente =
    estadoPedido?.paso === "codigo" && estadoPedido.email && estadoPedido !== descartado
      ? { email: estadoPedido.email, nombre: estadoPedido.nombre ?? "" }
      : null;

  // ── Paso 2: escribir el código ──────────────────────────────────────────
  if (pendiente) {
    const error = estadoCodigo?.error ?? (estadoPedido?.paso === "codigo" ? estadoPedido.error : undefined);
    return (
      <div>
        <p className="border-l-2 border-hoja bg-nube px-4 py-3 text-sm">
          {fmt(t.codigoEnviado, { email: pendiente.email })}
        </p>

        <form action={verificar} className="mt-8 space-y-5">
          <input type="hidden" name="email" value={pendiente.email} />
          <input type="hidden" name="nombre" value={pendiente.nombre} />
          <Campo
            etiqueta={t.codigo}
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={8}
            required
            autoFocus
            className="datos text-center text-xl tracking-[0.5em]"
          />
          {error ? <AvisoError texto={error} /> : null}
          <Boton type="submit" disabled={verificando} className="w-full">
            {verificando ? t.momento : t.entrar}
          </Boton>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setDescartado(estadoPedido)}
            className="border-b border-linea pb-0.5 text-pizarra transition-colors hover:border-tinta hover:text-tinta"
          >
            {t.otroCorreo}
          </button>
          <form action={pedir}>
            <input type="hidden" name="email" value={pendiente.email} />
            <input type="hidden" name="nombre" value={pendiente.nombre} />
            <button
              type="submit"
              disabled={pidiendo}
              className="border-b border-linea pb-0.5 text-pizarra transition-colors hover:border-tinta hover:text-tinta disabled:opacity-60"
            >
              {t.reenviar}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Paso 1: correo (o correo y contraseña) ──────────────────────────────
  const usarClave = pestana === "entrar" && conContrasena;
  const estado = usarClave ? estadoClave : estadoPedido === descartado ? null : estadoPedido;
  const ocupado = usarClave ? entrando : pidiendo;

  return (
    <div>
      <div className="flex border-b border-linea">
        {(["entrar", "registro"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPestana(p)}
            aria-pressed={pestana === p}
            className={`-mb-px border-b-2 px-1 pb-3 pr-6 text-sm transition-colors ${
              pestana === p ? "border-tinta text-tinta" : "border-transparent text-pizarra hover:text-tinta"
            }`}
          >
            {p === "entrar" ? t.pestanaEntrar : t.pestanaRegistro}
          </button>
        ))}
      </div>

      <form action={usarClave ? entrarConClave : pedir} className="mt-8 space-y-5">
        {pestana === "registro" ? (
          <Campo etiqueta={t.nombre} name="nombre" type="text" autoComplete="organization" required />
        ) : null}
        <Campo etiqueta={t.correo} name="email" type="email" autoComplete="email" required />
        {usarClave ? (
          <Campo etiqueta={t.contrasena} name="password" type="password" autoComplete="current-password" required />
        ) : null}

        {pestana === "registro" ? <p className="text-xs leading-relaxed text-pizarra">{t.registroNota}</p> : null}
        {estado?.error ? <AvisoError texto={estado.error} /> : null}

        <Boton type="submit" disabled={ocupado} className="w-full">
          {ocupado ? t.momento : usarClave ? t.entrar : pestana === "registro" ? t.crearCuenta : t.enviarCodigo}
        </Boton>
      </form>

      {pestana === "entrar" ? (
        <button
          type="button"
          onClick={() => setConContrasena((v) => !v)}
          className="mt-5 border-b border-linea pb-0.5 text-sm text-pizarra transition-colors hover:border-tinta hover:text-tinta"
        >
          {conContrasena ? t.usarCodigo : t.usarContrasena}
        </button>
      ) : null}

      {demo ? (
        <p className="mt-6 border-l-2 border-linea pl-4 text-xs leading-relaxed text-pizarra">{t.demo}</p>
      ) : null}
    </div>
  );
}

function AvisoError({ texto }: { texto: string }) {
  return <p className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">{texto}</p>;
}

function Campo({
  etiqueta,
  name,
  className = "",
  ...props
}: { etiqueta: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <input
        name={name}
        className={`mt-2 w-full border border-linea bg-papel px-4 py-3 text-sm outline-none transition-colors focus:border-tinta ${className}`}
        {...props}
      />
    </label>
  );
}
