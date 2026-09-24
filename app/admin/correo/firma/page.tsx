import type { Metadata } from "next";
import EditorCorreo from "@/components/admin/EditorCorreo";
import FormularioAccion from "@/components/admin/FormularioAccion";
import { usuarioAdmin } from "@/lib/admin";
import { obtenerFirma } from "@/lib/buzon";
import { guardarFirma } from "../acciones";

export const metadata: Metadata = { title: "Firma" };
export const dynamic = "force-dynamic";

const EJEMPLO =
  "<p><strong>Luis Herrera</strong><br>Tropical Butterfly Exports</p>" +
  '<p><span style="color: #5b6166">San Rafael de Alajuela, Costa Rica · +506 0000 0000</span><br>' +
  '<a href="https://tropicalbutterflies.lat">tropicalbutterflies.lat</a></p>';

export default async function FirmaCorreo() {
  const admin = await usuarioAdmin();
  const firma = admin ? await obtenerFirma(admin.id) : "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="titulo-3">Firma</h1>
        <p className="mt-1 max-w-2xl text-sm text-pizarra">
          Se agrega sola al final de cada correo nuevo y de cada respuesta, y la podés cambiar antes de enviar. Es tuya:
          cada administrador tiene la suya.
          {!firma ? " Te dejamos un ejemplo para que lo edites." : ""}
        </p>
      </div>

      <FormularioAccion accion={guardarFirma} boton="Guardar firma" className="border border-linea bg-papel p-5">
        <EditorCorreo inicialHtml={firma || EJEMPLO} conAdjuntos={false} alto="min-h-40" />
        <p className="mt-2 text-xs text-pizarra">Dejala vacía y guardá para no usar firma.</p>
      </FormularioAccion>
    </div>
  );
}
