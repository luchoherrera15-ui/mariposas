import type { Metadata } from "next";
import { listarClientes, listarPedidos } from "@/lib/admin";
import { fecha, moneda, numero } from "@/lib/formato";
import { cambiarAprobacion, cambiarRol } from "../acciones";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesAdmin() {
  const [clientes, pedidos] = await Promise.all([listarClientes(), listarPedidos()]);
  const pendientes = clientes.filter((c) => !c.aprobado).length;

  const totales = new Map<string, { pedidos: number; mariposas: number; invertido: number }>();
  for (const p of pedidos) {
    if (p.estado === "cancelado") continue;
    const t = totales.get(p.cliente_id) ?? { pedidos: 0, mariposas: 0, invertido: 0 };
    t.pedidos += 1;
    t.mariposas += p.items.reduce((s, i) => s + i.cantidad, 0);
    t.invertido += p.total;
    totales.set(p.cliente_id, t);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo-2">Clientes</h1>
        <p className="mt-2 max-w-2xl text-pizarra">
          Las cuentas se crean desde el registro del sitio y quedan en revisión: ven su panel, pero no pedidos,
          envíos ni precios hasta que las aprobás acá. También podés dar o quitar acceso de administración.
        </p>
        {pendientes > 0 ? (
          <p className="mt-4 inline-block border-l-2 border-morpho bg-nube px-4 py-2 text-sm">
            {pendientes === 1 ? "Hay 1 cuenta esperando aprobación." : `Hay ${pendientes} cuentas esperando aprobación.`}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto border border-linea bg-papel">
        <table className="w-full min-w-[60rem] text-sm">
          <thead>
            <tr className="border-b border-linea text-left text-pizarra">
              <th className="px-4 py-3 font-normal">Cliente</th>
              <th className="px-4 py-3 font-normal">Correo</th>
              <th className="px-4 py-3 font-normal">Alta</th>
              <th className="px-4 py-3 text-right font-normal">Pedidos</th>
              <th className="px-4 py-3 text-right font-normal">Mariposas</th>
              <th className="px-4 py-3 text-right font-normal">Comprado</th>
              <th className="px-4 py-3 font-normal">Cuenta</th>
              <th className="px-4 py-3 font-normal">Acceso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {clientes.map((c) => {
              const t = totales.get(c.id) ?? { pedidos: 0, mariposas: 0, invertido: 0 };
              return (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    {c.nombre}
                    {c.empresa ? <span className="block text-xs text-pizarra">{c.empresa}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-pizarra">{c.email}</td>
                  <td className="datos px-4 py-3 text-pizarra">{fecha(c.creado_en)}</td>
                  <td className="datos px-4 py-3 text-right">{numero(t.pedidos)}</td>
                  <td className="datos px-4 py-3 text-right">{numero(t.mariposas)}</td>
                  <td className="datos px-4 py-3 text-right">{moneda(t.invertido)}</td>
                  <td className="px-4 py-3">
                    <form action={cambiarAprobacion} className="flex items-center gap-2">
                      <input type="hidden" name="cliente_id" value={c.id} />
                      <input type="hidden" name="aprobado" value={c.aprobado ? "false" : "true"} />
                      <span className={c.aprobado ? "text-hoja" : "font-medium text-morpho"}>
                        {c.aprobado ? "Aprobada" : "En revisión"}
                      </span>
                      <button
                        className={
                          c.aprobado
                            ? "border border-linea px-2.5 py-1 text-xs transition-colors hover:border-tinta"
                            : "bg-tinta px-2.5 py-1 text-xs text-papel transition-colors hover:bg-morpho"
                        }
                      >
                        {c.aprobado ? "Quitar" : "Aprobar"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={cambiarRol} className="flex items-center gap-2">
                      <input type="hidden" name="cliente_id" value={c.id} />
                      <input type="hidden" name="rol" value={c.rol === "admin" ? "cliente" : "admin"} />
                      <span className={c.rol === "admin" ? "text-morpho" : "text-pizarra"}>
                        {c.rol === "admin" ? "Administrador" : "Cliente"}
                      </span>
                      <button className="border border-linea px-2.5 py-1 text-xs transition-colors hover:border-tinta">
                        {c.rol === "admin" ? "Quitar" : "Hacer admin"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
