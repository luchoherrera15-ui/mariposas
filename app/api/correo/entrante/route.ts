import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { guardarEntrante } from "@/lib/buzon";

/**
 * Recibe los correos de info@ desde el Email Worker de Cloudflare.
 * El Worker manda el correo crudo en el cuerpo y la clave compartida en la
 * cabecera x-buzon-clave (variable CORREO_WEBHOOK_SECRETO en Vercel y en el
 * Worker). Sin la clave correcta responde 401 y no guarda nada.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMITE_BYTES = 25 * 1024 * 1024;

function claveValida(recibida: string | null) {
  const esperada = process.env.CORREO_WEBHOOK_SECRETO;
  if (!esperada || !recibida) return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!claveValida(request.headers.get("x-buzon-clave"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const crudo = await request.arrayBuffer();
  if (!crudo.byteLength) return NextResponse.json({ error: "Correo vacío" }, { status: 400 });
  if (crudo.byteLength > LIMITE_BYTES) return NextResponse.json({ error: "Correo demasiado grande" }, { status: 413 });

  try {
    const id = await guardarEntrante(crudo, {
      de: request.headers.get("x-buzon-de"),
      para: request.headers.get("x-buzon-para"),
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("correo entrante:", error);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
