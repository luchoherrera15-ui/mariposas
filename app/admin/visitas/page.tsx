import type { Metadata } from "next";
import Link from "next/link";
import { INTERESES_VISITA, type InteresVisita } from "@/lib/avisos";
import { modoDemo } from "@/lib/config";
import { fecha } from "@/lib/formato";
import { supabaseAdmin } from "@/lib/supabase-servidor";
import { actualizarVisita } from "./acciones";

export const metadata: Metadata = { title: "Visitas" };
export const dynamic = "force-dynamic";

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  nueva: { texto: "Nueva", clase: "bg-rose-100 text-rose-900" },
  en_contacto: { texto: "En contacto", clase: "bg-amber-100 text-amber-900" },
  confirmada: { texto: "Confirmada", clase: "bg-emerald-100 text-emerald-900" },
  cerrada: { texto: "Cerrada", clase: "bg-stone-200 text-stone-700" },
};

type Visita = {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string;
  pais: string;
  fechas: string | null;
  personas: number | null;
  intereses: string[];
  mensaje: string | null;
  idioma: string;
  estado: string;
  notas: string | null;
  creado_en: string;
};

export default async function VisitasAdmin() {
  const { data } = modoDemo
    ? { data: [] }
    : await supabaseAdmin().from("solicitudes_visita").select("*").order("creado_en", { ascending: false }).limit(200);
  const visitas = (data ?? []) as Visita[];
  // Nuevas primero; dentro de cada estado, la más reciente arriba.
  const orden = ["nueva", "en_contacto", "confirmada", "cerrada"];
  visitas.sort((a, b) => orden.indexOf(a.estado) - orden.indexOf(b.estado));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">Solicitudes de visita</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          Llegan desde la página “Visitanos”. Respondé por correo con una propuesta y anotá acá en qué quedó.
        </p>
      </div>

      {visitas.length === 0 ? (
        <p className="border border-dashed border-linea p-8 text-sm text-pizarra">Todavía no hay solicitudes de visita.</p>
      ) : (
        <ul className="space-y-4">
          {visitas.map((v) => (
            <li key={v.id} className="border border-linea bg-papel p-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="titulo-3">{v.nombre}</span>
                {v.empresa ? <span className="text-pizarra">{v.empresa}</span> : null}
                <span className={`px-2 py-0.5 text-xs ${ESTADOS[v.estado]?.clase ?? ""}`}>{ESTADOS[v.estado]?.texto ?? v.estado}</span>
                <span className="datos ml-auto text-xs text-pizarra">{fecha(v.creado_en)}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                <Dato etiqueta="Correo">
                  <Link href={`/admin/correo/nuevo?para=${encodeURIComponent(v.email)}`} className="text-morpho hover:underline">
                    {v.email}
                  </Link>
                </Dato>
                <Dato etiqueta="País">{v.pais}</Dato>
                <Dato etiqueta="Fechas">{v.fechas ?? "—"}</Dato>
                <Dato etiqueta="Personas · idioma">
                  {v.personas ?? "—"} · <span className="datos uppercase">{v.idioma}</span>
                </Dato>
                <Dato etiqueta="Le interesa" ancho>
                  {v.intereses.length ? v.intereses.map((i) => INTERESES_VISITA[i as InteresVisita] ?? i).join(" · ") : "—"}
                </Dato>
                {v.mensaje ? (
                  <Dato etiqueta="Mensaje" ancho>
                    <span className="whitespace-pre-line">{v.mensaje}</span>
                  </Dato>
                ) : null}
              </dl>
              <form action={actualizarVisita} className="mt-4 flex flex-wrap items-end gap-3 border-t border-linea pt-4">
                <input type="hidden" name="visita_id" value={v.id} />
                <label className="text-sm">
                  <span className="block text-xs text-pizarra">Estado</span>
                  <select name="estado" defaultValue={v.estado} className="mt-1 border border-linea bg-papel px-2 py-1.5 text-sm">
                    {orden.map((e) => (
                      <option key={e} value={e}>
                        {ESTADOS[e].texto}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-64 flex-1 text-sm">
                  <span className="block text-xs text-pizarra">Notas internas</span>
                  <input
                    name="notas"
                    defaultValue={v.notas ?? ""}
                    placeholder="Ej.: propuesta enviada el 3/10, llegan 12 al 16 de marzo"
                    className="mt-1 w-full border border-linea bg-papel px-2 py-1.5 text-sm"
                  />
                </label>
                <button className="bg-tinta px-4 py-2 text-sm text-papel hover:bg-morpho">Guardar</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dato({ etiqueta, ancho = false, children }: { etiqueta: string; ancho?: boolean; children: React.ReactNode }) {
  return (
    <div className={ancho ? "sm:col-span-4" : ""}>
      <dt className="text-xs text-pizarra">{etiqueta}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
