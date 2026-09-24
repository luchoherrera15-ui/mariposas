import type { Metadata } from "next";
import Link from "next/link";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { Area, Campo } from "@/components/admin/campos";
import { buzonConfigurado, remitenteBuzon } from "@/lib/buzon";
import { enviarCorreo } from "../acciones";

export const metadata: Metadata = { title: "Redactar" };

export default async function RedactarCorreo({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const { para = "" } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/correo" className="text-sm text-pizarra hover:text-tinta">
          ← Volver al correo
        </Link>
        <h1 className="titulo-2 mt-2">Correo nuevo</h1>
        <p className="mt-2 text-pizarra">
          Sale desde <span className="datos">{remitenteBuzon() || "(sin configurar)"}</span>. Las respuestas llegan a
          este buzón y a tu Gmail.
        </p>
      </div>

      {!buzonConfigurado() ? (
        <p className="inline-block border-l-2 border-morpho bg-nube px-4 py-2 text-sm">
          Para enviar falta configurar RESEND_API_KEY y CORREO_BUZON en Vercel.
        </p>
      ) : (
        <FormularioAccion accion={enviarCorreo} boton="Enviar" className="space-y-4 border border-linea bg-papel p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Para" name="para" defaultValue={para} placeholder="cliente@ejemplo.com" required />
            <Campo etiqueta="Cc (opcional)" name="cc" ayuda="Varias direcciones separadas por coma." />
          </div>
          <Campo etiqueta="Asunto" name="asunto" required />
          <Area etiqueta="Mensaje" name="cuerpo" rows={12} required />
        </FormularioAccion>
      )}
    </div>
  );
}
