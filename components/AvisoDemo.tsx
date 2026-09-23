import { haySupabase, modoDemo } from "@/lib/config";

/**
 * Aviso de que el sitio corre con datos de ejemplo. Desaparece solo en cuanto
 * .env.local tiene credenciales y NEXT_PUBLIC_DEMO_DATA no está en "true".
 */
export default function AvisoDemo() {
  if (!modoDemo) return null;
  return (
    <div className="border-b border-linea bg-nube/60">
      <p className="mx-auto max-w-[76rem] px-6 py-2 text-xs text-pizarra">
        Modo demostración:{" "}
        {haySupabase
          ? "los datos son de ejemplo porque NEXT_PUBLIC_DEMO_DATA está en true."
          : "faltan las credenciales de Supabase en .env.local, así que los datos son de ejemplo."}
      </p>
    </div>
  );
}
