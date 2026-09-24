import { Suspense } from "react";
import NavCorreo from "@/components/admin/NavCorreo";
import { contarSinLeer, remitenteBuzon } from "@/lib/buzon";
import { modoDemo } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Buzón: carpetas a la izquierda, lista o conversación a la derecha. */
export default async function LayoutCorreo({ children }: { children: React.ReactNode }) {
  if (modoDemo) {
    return (
      <div className="space-y-4">
        <h1 className="titulo-2">Correo</h1>
        <p className="text-pizarra">El buzón necesita Supabase configurado; en modo demostración no hay correos.</p>
      </div>
    );
  }

  const sinLeer = await contarSinLeer();
  return (
    <div className="grid gap-6 lg:grid-cols-[11.5rem_minmax(0,1fr)]">
      <aside className="lg:pt-1">
        <Suspense fallback={null}>
          <NavCorreo sinLeer={sinLeer} />
        </Suspense>
        <p className="datos mt-6 hidden truncate text-[0.7rem] text-pizarra lg:block" title={remitenteBuzon()}>
          {remitenteBuzon().match(/<([^>]+)>/)?.[1] ?? remitenteBuzon()}
        </p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
