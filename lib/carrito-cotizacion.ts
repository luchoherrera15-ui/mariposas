"use client";

import { useSyncExternalStore } from "react";

/**
 * Especies que el visitante va juntando para pedir una cotización. Vive en
 * localStorage (sobrevive a recargas y no exige cuenta); se vacía al enviar.
 */
export type LineaCarrito = { slug: string; cantidad: number };

/** Mínimo de pupas por especie (las condiciones de envío dicen 25). */
export const MINIMO_POR_ESPECIE = 25;

const CLAVE = "cotizacion";
const EVENTO = "cotizacion-cambio";
const VACIO: LineaCarrito[] = [];
let cache: { crudo: string | null; lista: LineaCarrito[] } = { crudo: null, lista: VACIO };

function leer(): LineaCarrito[] {
  let crudo: string | null = null;
  try {
    crudo = localStorage.getItem(CLAVE);
  } catch {
    return VACIO;
  }
  // useSyncExternalStore exige la misma referencia si no cambió nada.
  if (crudo === cache.crudo) return cache.lista;
  let lista: LineaCarrito[] = VACIO;
  try {
    const datos = JSON.parse(crudo ?? "[]");
    if (Array.isArray(datos)) {
      lista = datos
        .filter((l) => l && typeof l.slug === "string")
        .map((l) => ({ slug: l.slug, cantidad: Math.max(1, Math.round(Number(l.cantidad) || MINIMO_POR_ESPECIE)) }));
    }
  } catch {
    lista = VACIO;
  }
  cache = { crudo, lista };
  return lista;
}

function guardar(lista: LineaCarrito[]) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Navegación privada o almacenamiento bloqueado: el carrito vive solo en esta página.
  }
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso); // otras pestañas
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

export function useCarrito() {
  return useSyncExternalStore(suscribir, leer, () => VACIO);
}

export const carrito = {
  agregar(slug: string, cantidad = MINIMO_POR_ESPECIE) {
    const lista = leer();
    if (lista.some((l) => l.slug === slug)) return;
    guardar([...lista, { slug, cantidad }]);
  },
  cantidad(slug: string, cantidad: number) {
    guardar(leer().map((l) => (l.slug === slug ? { ...l, cantidad: Math.max(1, Math.round(cantidad) || 1) } : l)));
  },
  quitar(slug: string) {
    guardar(leer().filter((l) => l.slug !== slug));
  },
  vaciar() {
    guardar([]);
  },
};
