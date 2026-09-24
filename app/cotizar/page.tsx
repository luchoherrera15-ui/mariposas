import type { Metadata } from "next";
import AvisoDemo from "@/components/AvisoDemo";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { obtenerEspecies, obtenerUsuario } from "@/lib/datos";
import { slugDeEspecie } from "@/lib/especies-foto";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import FormularioCotizacion from "./FormularioCotizacion";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).cotizar.metaTitulo };
}

export default async function Cotizar() {
  const [especies, usuario, t] = await Promise.all([obtenerEspecies(), obtenerUsuario(), obtenerTextos()]);

  // Con sesión: se completan empresa y país con lo que ya sabemos del cliente.
  let datosCliente: { email: string; empresa: string; pais: string } | null = null;
  if (usuario && usuario.id !== "demo") {
    const { data } = await supabaseAdmin().from("perfiles").select("empresa, pais").eq("id", usuario.id).maybeSingle();
    datosCliente = { email: usuario.email, empresa: (data?.empresa as string) ?? "", pais: (data?.pais as string) ?? "" };
  }

  return (
    <>
      <AvisoDemo />
      <SiteHeader />
      <main className="mx-auto w-full max-w-[76rem] flex-1 px-6 py-16">
        <div className="max-w-2xl">
          <h1 className="titulo-2">{t.cotizar.titulo}</h1>
          <p className="lede mt-5">{t.cotizar.entradilla}</p>
        </div>
        <div className="mt-12">
          <FormularioCotizacion
            especies={especies.map((e) => ({
              slug: e.slug,
              nombre: e.nombre_comun,
              cientifico: e.nombre_cientifico,
              foto: slugDeEspecie(e.nombre_cientifico),
            }))}
            usuario={datosCliente}
            t={t.cotizar}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
