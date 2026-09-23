import type { Metadata } from "next";
import Link from "next/link";
import { BarraProgreso, Chip, Tarjeta, Vacio } from "@/components/ui";
import { obtenerPedidos } from "@/lib/datos";
import { colorEnvio, etiquetaEnvio, fecha, numero, progresoEnvio } from "@/lib/formato";

export const metadata: Metadata = { title: "Envíos y tracking" };

export default async function PanelEnvios() {
  const pedidos = await obtenerPedidos();
  const conEnvio = pedidos.filter((p) => p.envio !== null);
  const enCurso = conEnvio.filter((p) => p.envio!.estado !== "entregado");
  const entregados = conEnvio.filter((p) => p.envio!.estado === "entregado");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">Envíos y tracking</h1>
        <p className="mt-1 text-pizarra">Cada envío con su guía, su ruta y el historial completo de movimientos.</p>
      </div>

      <Grupo titulo="En curso" pedidos={enCurso} vacio="No hay envíos en curso." />
      <Grupo titulo="Entregados" pedidos={entregados} vacio="Todavía no hay envíos entregados." />
    </div>
  );
}

function Grupo({
  titulo,
  pedidos,
  vacio,
}: {
  titulo: string;
  pedidos: Awaited<ReturnType<typeof obtenerPedidos>>;
  vacio: string;
}) {
  return (
    <section>
      <h2 className="titulo-3">{titulo}</h2>
      <div className="mt-4 space-y-4">
        {pedidos.length === 0 ? (
          <Vacio>{vacio}</Vacio>
        ) : (
          pedidos.map((p) => {
            const envio = p.envio!;
            const mariposas = p.items.reduce((s, i) => s + i.cantidad, 0);
            return (
              <Tarjeta key={envio.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="datos text-lg">{p.codigo}</p>
                      <Chip className={colorEnvio[envio.estado]}>{etiquetaEnvio[envio.estado]}</Chip>
                    </div>
                    <p className="mt-1 text-sm text-pizarra">
                      {envio.origen} → {envio.destino} · <span className="datos">{numero(mariposas)}</span> mariposas
                    </p>
                  </div>
                  <Link
                    href={`/panel/envios/${envio.id}`}
                    className="border border-linea px-4 py-2 text-sm font-semibold text-tinta transition hover:border-tinta"
                  >
                    Ver tracking
                  </Link>
                </div>

                <div className="mt-4">
                  <BarraProgreso
                    porcentaje={progresoEnvio(envio.estado)}
                    className={envio.estado === "entregado" ? "bg-tinta" : "bg-morpho"}
                  />
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <Dato etiqueta="Transportista" valor={envio.transportista ?? "—"} />
                  <Dato etiqueta="Guía" valor={envio.numero_guia ?? "Por asignar"} />
                  <Dato
                    etiqueta={envio.entregado_en ? "Entregado" : "Entrega estimada"}
                    valor={fecha(envio.entregado_en ?? envio.entrega_estimada)}
                  />
                  <Dato
                    etiqueta="Temperatura"
                    valor={envio.temperatura_c === null ? "—" : `${envio.temperatura_c} °C`}
                  />
                </dl>
              </Tarjeta>
            );
          })
        )}
      </div>
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-pizarra">{etiqueta}</dt>
      <dd className="datos mt-0.5 font-medium text-tinta">{valor}</dd>
    </div>
  );
}
