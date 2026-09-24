import Link from "next/link";

const carpetas = [
  { clave: "entrada", texto: "Recibidos" },
  { clave: "enviados", texto: "Enviados" },
  { clave: "archivo", texto: "Archivados" },
] as const;

export default function NavCorreo({ activa, sinLeer }: { activa?: string; sinLeer?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {carpetas.map((c) => (
        <Link
          key={c.clave}
          href={c.clave === "entrada" ? "/admin/correo" : `/admin/correo?carpeta=${c.clave}`}
          className={`px-3.5 py-2 text-sm transition-colors ${
            activa === c.clave ? "bg-tinta text-papel" : "border border-linea hover:border-tinta"
          }`}
        >
          {c.texto}
          {c.clave === "entrada" && sinLeer ? <span className="datos ml-2 text-xs">{sinLeer}</span> : null}
        </Link>
      ))}
      <Link
        href="/admin/correo/nuevo"
        className="ml-auto bg-morpho px-4 py-2 text-sm font-medium text-papel transition-colors hover:bg-tinta"
      >
        Redactar
      </Link>
    </div>
  );
}
