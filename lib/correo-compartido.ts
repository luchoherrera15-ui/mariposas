/**
 * Constantes del buzón que usan tanto el servidor (lib/buzon.ts) como el
 * editor en el navegador. Sin "server-only" a propósito.
 */

/** Bucket privado con los adjuntos (ver 010_correo_adjuntos_firma.sql). */
export const BUCKET_CORREO = "mariposas-correo";

/** Tope por correo: Resend acepta hasta 40 MB ya codificados en base64. */
export const LIMITE_ADJUNTOS_BYTES = 25 * 1024 * 1024;

export function tamano(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
