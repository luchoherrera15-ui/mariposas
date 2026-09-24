"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import Foto from "@/components/Foto";
import { Boton } from "@/components/ui";
import { MINIMO_POR_ESPECIE, carrito, useCarrito } from "@/lib/carrito-cotizacion";
import { fmt } from "@/lib/i18n/idiomas";
import type { Textos } from "@/lib/i18n/textos";
import { enviarCodigo, type EstadoFormulario } from "../entrar/acciones";
import { enviarSolicitud, verificarYEnviar, type EstadoSolicitud } from "./acciones";

export type EspecieCotizable = { slug: string; nombre: string; cientifico: string; foto: string | null };

/**
 * Cotización en tres partes: especies y cantidades (del carrito), datos del
 * envío y, si no hay sesión, correo + código. El código confirma el correo,
 * inicia la sesión y crea la solicitud en esa cuenta.
 */
export default function FormularioCotizacion({
  especies,
  usuario,
  t,
}: {
  especies: EspecieCotizable[];
  usuario: { email: string; empresa: string; pais: string } | null;
  t: Textos["cotizar"];
}) {
  const router = useRouter();
  const lista = useCarrito();
  const porSlug = new Map(especies.map((e) => [e.slug, e]));
  const lineas = lista.filter((l) => porSlug.has(l.slug));

  const [datos, setDatos] = useState({
    empresa: usuario?.empresa ?? "",
    pais: usuario?.pais ?? "",
    fecha: "",
    mensaje: "",
    email: "",
  });
  const campo = (k: keyof typeof datos) => ({
    value: datos[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDatos((d) => ({ ...d, [k]: e.target.value })),
  });

  const [estadoDirecto, enviarDirecto, enviandoDirecto] = useActionState<EstadoSolicitud, FormData>(enviarSolicitud, null);
  const [estadoCodigo, pedirCodigo, pidiendo] = useActionState<EstadoFormulario, FormData>(enviarCodigo, null);
  const [estadoVerificado, verificar, verificando] = useActionState<EstadoSolicitud, FormData>(verificarYEnviar, null);
  const [descartado, setDescartado] = useState<EstadoFormulario>(null);
  const esperandoCodigo = !usuario && estadoCodigo?.paso === "codigo" && estadoCodigo !== descartado;

  // Solicitud creada: se vacía el carrito y se abre en el panel del cliente.
  const creada = estadoDirecto?.id ?? estadoVerificado?.id;
  useEffect(() => {
    if (!creada) return;
    carrito.vaciar();
    router.push(`/panel/cotizaciones/${creada}?nueva=1`);
  }, [creada, router]);

  if (!lineas.length && !creada) {
    return (
      <div className="border border-dashed border-linea p-10 text-center">
        <p className="text-pizarra">{t.vacia}</p>
        <Link href="/especies" className="mt-5 inline-block bg-tinta px-6 py-3 text-sm text-papel hover:bg-morpho">
          {t.verCatalogo}
        </Link>
      </div>
    );
  }

  const pupas = lineas.reduce((s, l) => s + l.cantidad, 0);
  const bajoMinimo = lineas.some((l) => l.cantidad < MINIMO_POR_ESPECIE);
  const ocultos = (
    <>
      <input type="hidden" name="lineas" value={JSON.stringify(lineas)} />
      <input type="hidden" name="empresa" value={datos.empresa} />
      <input type="hidden" name="pais" value={datos.pais} />
      <input type="hidden" name="fecha" value={datos.fecha} />
      <input type="hidden" name="mensaje" value={datos.mensaje} />
    </>
  );
  const error = estadoDirecto?.error ?? estadoVerificado?.error ?? (estadoCodigo !== descartado ? estadoCodigo?.error : undefined);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
      {/* ── Especies ─────────────────────────────────────────────────── */}
      <div>
        <p className="datos text-sm text-pizarra">
          {fmt(t.resumen, { especies: lineas.length, pupas })} · {fmt(t.minimo, { n: MINIMO_POR_ESPECIE })}
        </p>
        <ul className="mt-4 divide-y divide-linea border-y border-linea">
          {lineas.map((l) => {
            const e = porSlug.get(l.slug)!;
            const corto = l.cantidad < MINIMO_POR_ESPECIE;
            return (
              <li key={l.slug} className="flex items-center gap-4 py-4">
                <Foto slug={e.foto} alt={e.nombre} className="aspect-square w-16 shrink-0" sizes="64px" />
                <div className="min-w-0 flex-1">
                  <Link href={`/especies/${e.slug}`} className="block truncate hover:text-morpho">
                    {e.nombre}
                  </Link>
                  <p className="cientifico truncate text-sm text-pizarra">{e.cientifico}</p>
                </div>
                <label className="text-right">
                  <span className="sr-only">{t.cantidad}</span>
                  <input
                    type="number"
                    min={MINIMO_POR_ESPECIE}
                    step={5}
                    value={l.cantidad}
                    onChange={(ev) => carrito.cantidad(l.slug, Number(ev.target.value))}
                    className={`datos w-24 border bg-papel px-2 py-1.5 text-right text-sm outline-none focus:border-tinta ${
                      corto ? "border-red-400" : "border-linea"
                    }`}
                  />
                  <span className="mt-0.5 block text-xs text-pizarra">{t.cantidad}</span>
                </label>
                <button
                  type="button"
                  onClick={() => carrito.quitar(l.slug)}
                  aria-label={`${t.quitar} ${e.nombre}`}
                  className="text-pizarra hover:text-red-800"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
        <Link href="/especies" className="mt-4 inline-block border-b border-linea pb-0.5 text-sm hover:border-tinta">
          + {t.verCatalogo}
        </Link>
      </div>

      {/* ── Datos y envío ────────────────────────────────────────────── */}
      <div>
        <h2 className="titulo-3">{t.datosTitulo}</h2>
        <div className="mt-5 space-y-4">
          <Entrada etiqueta={t.empresa} {...campo("empresa")} required autoComplete="organization" />
          <Entrada etiqueta={t.pais} {...campo("pais")} required autoComplete="country-name" />
          <Entrada etiqueta={t.fecha} type="date" {...campo("fecha")} />
          <label className="block">
            <span className="text-sm text-pizarra">{t.mensaje}</span>
            <textarea
              rows={3}
              {...campo("mensaje")}
              className="mt-1.5 w-full border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta"
            />
            <span className="mt-1 block text-xs text-pizarra">{t.mensajeAyuda}</span>
          </label>
        </div>

        <div className="mt-8 border-t border-linea pt-6">
          {usuario ? (
            <form action={enviarDirecto} className="space-y-4">
              {ocultos}
              <p className="text-sm text-pizarra">{fmt(t.comoCliente, { email: usuario.email })}</p>
              {error ? <AvisoError texto={error} /> : null}
              <Boton type="submit" disabled={enviandoDirecto || bajoMinimo || !!creada} className="w-full">
                {enviandoDirecto || creada ? t.enviando : t.enviar}
              </Boton>
            </form>
          ) : esperandoCodigo ? (
            <form action={verificar} className="space-y-4">
              {ocultos}
              <input type="hidden" name="email" value={estadoCodigo?.email ?? ""} />
              <p className="border-l-2 border-hoja bg-nube px-4 py-3 text-sm">
                {fmt(t.codigoEnviado, { email: estadoCodigo?.email ?? "" })}
              </p>
              <Entrada
                etiqueta={t.codigo}
                name="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                required
                autoFocus
                className="datos text-center text-xl tracking-[0.5em]"
              />
              {error ? <AvisoError texto={error} /> : null}
              <Boton type="submit" disabled={verificando || bajoMinimo || !!creada} className="w-full">
                {verificando || creada ? t.enviando : t.enviar}
              </Boton>
              <button
                type="button"
                onClick={() => setDescartado(estadoCodigo)}
                className="border-b border-linea pb-0.5 text-sm text-pizarra hover:border-tinta hover:text-tinta"
              >
                {t.otroCorreo}
              </button>
            </form>
          ) : (
            <form action={pedirCodigo} className="space-y-4">
              <input type="hidden" name="nombre" value={datos.empresa} />
              <Entrada etiqueta={t.correo} name="email" type="email" {...campo("email")} required autoComplete="email" />
              <p className="text-xs leading-relaxed text-pizarra">{t.correoAyuda}</p>
              {error ? <AvisoError texto={error} /> : null}
              <Boton type="submit" disabled={pidiendo || bajoMinimo || !datos.empresa || !datos.pais} className="w-full">
                {pidiendo ? t.enviando : t.continuar}
              </Boton>
            </form>
          )}
          {bajoMinimo ? <p className="mt-3 text-xs text-red-800">{fmt(t.errores.minimo, { n: MINIMO_POR_ESPECIE })}</p> : null}
        </div>
      </div>
    </div>
  );
}

function AvisoError({ texto }: { texto: string }) {
  return <p className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900">{texto}</p>;
}

function Entrada({
  etiqueta,
  className = "",
  ...props
}: { etiqueta: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm text-pizarra">{etiqueta}</span>
      <input
        className={`mt-1.5 w-full border border-linea bg-papel px-3 py-2 text-sm outline-none focus:border-tinta ${className}`}
        {...props}
      />
    </label>
  );
}
