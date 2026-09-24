import type { Metadata } from "next";
import Link from "next/link";
import EditorCorreo from "@/components/admin/EditorCorreo";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { Campo } from "@/components/admin/campos";
import { usuarioAdmin } from "@/lib/admin";
import { buzonConfigurado, obtenerFirma, remitenteBuzon } from "@/lib/buzon";
import { enviarCorreo } from "../acciones";

export const metadata: Metadata = { title: "Redactar" };

export default async function RedactarCorreo({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const [{ para = "" }, admin] = await Promise.all([searchParams, usuarioAdmin()]);
  const firma = admin ? await obtenerFirma(admin.id) : "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="titulo-3">Correo nuevo</h1>
        <p className="mt-1 text-sm text-pizarra">
          Sale desde <span className="datos">{remitenteBuzon() || "(sin configurar)"}</span>. Las respuestas llegan a
          este buzón y a tu Gmail.
        </p>
      </div>

      {!buzonConfigurado() ? (
        <p className="border-l-2 border-morpho bg-nube px-4 py-2 text-sm">
          Para enviar falta configurar RESEND_API_KEY y CORREO_BUZON en Vercel.
        </p>
      ) : (
        <FormularioAccion accion={enviarCorreo} boton="Enviar" className="space-y-4 border border-linea bg-papel p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Para" name="para" defaultValue={para} placeholder="cliente@ejemplo.com" required />
            <Campo etiqueta="Cc (opcional)" name="cc" ayuda="Varias direcciones separadas por coma." />
          </div>
          <Campo etiqueta="Asunto" name="asunto" required />
          <EditorCorreo firmaHtml={firma} autoFocus={Boolean(para)} />
          {!firma ? (
            <p className="text-xs text-pizarra">
              Todavía no tenés firma. Podés crearla en <Link href="/admin/correo/firma" className="underline">Firma</Link>.
            </p>
          ) : null}
        </FormularioAccion>
      )}
    </div>
  );
}
