import type { Metadata } from "next";
import Link from "next/link";
import CuentaEnRevision from "@/components/panel/CuentaEnRevision";
import { BarraProgreso, Chip, Tarjeta, Vacio } from "@/components/ui";
import { obtenerPedidos, obtenerUsuario } from "@/lib/datos";
import { colorEnvio, progresoEnvio, type Formato } from "@/lib/formato";
import { obtenerFormato, obtenerTextos } from "@/lib/i18n/servidor";
import type { Textos } from "@/lib/i18n/textos";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await obtenerTextos()).panel.envios.metaTitulo };
}

export default async function PanelEnvios() {
  const [usuario, pedidos, t, formato] = await Promise.all([
    obtenerUsuario(),
    obtenerPedidos(),
    obtenerTextos(),
    obtenerFormato(),
  ]);
  const te = t.panel.envios;
  const conEnvio = pedidos.filter((p) => p.envio !== null);
  const enCurso = conEnvio.filter((p) => p.envio!.estado !== "entregado");
  const entregados = conEnvio.filter((p) => p.envio!.estado === "entregado");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">{te.titulo}</h1>
        <p className="mt-1 text-pizarra">{te.subtitulo}</p>
      </div>

      {!usuario?.aprobado ? (
        <CuentaEnRevision />
      ) : (
        <>
          <Grupo titulo={te.enCurso} pedidos={enCurso} vacio={te.sinEnCurso} t={t} formato={formato} />
          <Grupo titulo={te.entregados} pedidos={entregados} vacio={te.sinEntregados} t={t} formato={formato} />
        </>
      )}
    </div>
  );
}

function Grupo({
  titulo,
  pedidos,
  vacio,
  t,
  formato: { fecha, numero },
}: {
  titulo: string;
  pedidos: Awaited<ReturnType<typeof obtenerPedidos>>;
  vacio: string;
  t: Textos;
  formato: Formato;
}) {
  const te = t.panel.envios;
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
                      <Chip className={colorEnvio[envio.estado]}>{t.estadosEnvio[envio.estado]}</Chip>
                    </div>
                    <p className="mt-1 text-sm text-pizarra">
                      {envio.origen} → {envio.destino} · <span className="datos">{numero(mariposas)}</span>{" "}
                      {te.mariposas}
                    </p>
                  </div>
                  <Link
                    href={`/panel/envios/${envio.id}`}
                    className="border border-linea px-4 py-2 text-sm font-semibold text-tinta transition hover:border-tinta"
                  >
                    {te.verTracking}
                  </Link>
                </div>

                <div className="mt-4">
                  <BarraProgreso
                    porcentaje={progresoEnvio(envio.estado)}
                    className={envio.estado === "entregado" ? "bg-tinta" : "bg-morpho"}
                  />
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <Dato etiqueta={te.transportista} valor={envio.transportista ?? "—"} />
                  <Dato etiqueta={te.guia} valor={envio.numero_guia ?? te.porAsignar} />
                  <Dato
                    etiqueta={envio.entregado_en ? te.entregado : te.entregaEstimada}
                    valor={fecha(envio.entregado_en ?? envio.entrega_estimada)}
                  />
                  <Dato
                    etiqueta={te.temperatura}
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
