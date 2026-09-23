import Link from "next/link";
import { redirect } from "next/navigation";
import AvisoDemo from "@/components/AvisoDemo";
import NavPanel from "@/components/panel/NavPanel";
import { obtenerMarca } from "@/lib/ajustes";
import { obtenerUsuario } from "@/lib/datos";
import { salir } from "../entrar/acciones";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const [usuario, marca] = await Promise.all([obtenerUsuario(), obtenerMarca()]);
  if (!usuario) redirect("/entrar");

  return (
    <>
      <AvisoDemo />
      <header className="border-b border-linea bg-papel">
        <div className="mx-auto flex max-w-[82rem] items-center gap-4 px-4 py-3.5">
          <Link href="/" className="font-titulo text-[1.25rem] leading-none tracking-tight">
            {marca.nombre}
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-tinta">{usuario.nombre}</p>
              <p className="text-xs text-pizarra">{usuario.email}</p>
            </div>
            <form action={salir}>
              <button className="border border-linea px-3.5 py-2 text-sm font-medium text-tinta transition hover:border-tinta">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[82rem] flex-1 gap-8 px-4 py-8 lg:py-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <NavPanel />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <NavPanel />
          </div>
          {children}
        </main>
      </div>
    </>
  );
}
