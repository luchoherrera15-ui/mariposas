import type { Metadata } from "next";
import Link from "next/link";
import NavAdmin from "@/components/admin/NavAdmin";
import { obtenerMarca } from "@/lib/ajustes";
import { usuarioAdmin } from "@/lib/admin";
import { modoDemo } from "@/lib/config";
import { salir } from "../entrar/acciones";

export const metadata: Metadata = { title: { default: "Administración", template: "%s · Administración" } };

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const [admin, marca] = await Promise.all([usuarioAdmin(), obtenerMarca()]);

  if (!admin) {
    return (
      <main className="flex flex-1 flex-col justify-center px-6 py-32">
        <div className="mx-auto w-full max-w-[42rem]">
          <h1 className="titulo-2">Esta zona es solo para administración</h1>
          <p className="prosa mt-5 text-pizarra">
            Tu cuenta no tiene el rol de administrador. Para dártelo, abrí el SQL Editor de Supabase y corré:
          </p>
          <pre className="datos mt-6 overflow-x-auto border border-linea bg-papel p-4 text-xs leading-relaxed">
{`update perfiles set rol = 'admin'
where id = (select id from auth.users
            where lower(email) = lower('tucorreo@ejemplo.com'));`}
          </pre>
          <p className="mt-8 text-sm">
            <Link href="/panel" className="border-b border-linea pb-0.5 transition-colors hover:border-tinta">
              Ir al panel de clientes
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      {modoDemo ? (
        <div className="border-b border-linea bg-nube/60">
          <p className="mx-auto max-w-[82rem] px-6 py-2 text-xs text-pizarra">
            Modo demostración: podés recorrer el panel, pero no se guarda nada hasta configurar Supabase.
          </p>
        </div>
      ) : null}

      <header className="border-b border-linea bg-papel">
        <div className="mx-auto flex max-w-[82rem] items-center gap-4 px-6 py-4">
          <Link href="/admin" className="font-titulo text-[1.15rem] leading-none tracking-tight">
            {marca.nombre}
          </Link>
          <span className="datos hidden text-xs text-pizarra sm:inline">administración</span>

          <div className="ml-auto flex items-center gap-4">
            <Link href="/panel" className="hidden text-sm text-pizarra transition-colors hover:text-tinta sm:inline">
              Ver como cliente
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm">{admin.nombre}</p>
              <p className="text-xs text-pizarra">{admin.email}</p>
            </div>
            <form action={salir}>
              <button className="border border-linea px-3.5 py-2 text-sm transition-colors hover:border-tinta">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[82rem] flex-1 gap-10 px-6 py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <NavAdmin />
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <NavAdmin />
          </div>
          {children}
        </main>
      </div>
    </>
  );
}
