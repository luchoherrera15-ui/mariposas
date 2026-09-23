import { obtenerMarca } from "@/lib/ajustes";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { Tarjeta } from "../ui";

/**
 * Lo que ve una cuenta sin aprobar donde irían pedidos, envíos o precios.
 * La base igual no le devuelve esos datos (RLS): esto es solo la explicación.
 */
export default async function CuentaEnRevision() {
  const [t, marca] = await Promise.all([obtenerTextos(), obtenerMarca()]);
  // El correo va como enlace en medio de la frase traducida.
  const [antes, despues = ""] = t.panel.revision.contacto.split("{correo}");
  return (
    <Tarjeta fondo="bg-nube">
      <p className="text-xs font-semibold text-morpho">{t.panel.revision.etiqueta}</p>
      <h2 className="titulo-3 mt-2">{t.panel.revision.titulo}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pizarra">{t.panel.revision.texto}</p>
      <p className="mt-3 text-sm text-pizarra">
        {antes}
        <a href={`mailto:${marca.correo}`} className="border-b border-linea text-tinta hover:border-tinta">
          {marca.correo}
        </a>
        {despues}
      </p>
    </Tarjeta>
  );
}
