import Link from "next/link";
import { slugDeEspecie } from "@/lib/especies-foto";
import type { Especie } from "@/lib/tipos";
import Foto from "./Foto";

/** Tarjeta de la grilla; la usa también la ficha para "más de la familia". */
export default function TarjetaEspecie({
  especie: e,
  textoVacio,
  polilla,
  prioridad = false,
}: {
  especie: Especie;
  textoVacio: string;
  polilla: string;
  prioridad?: boolean;
}) {
  return (
    <Link href={`/especies/${e.slug}`} className="group block">
      <div className="relative overflow-hidden">
        <Foto
          slug={slugDeEspecie(e.nombre_cientifico)}
          alt={`${e.nombre_comun} (${e.nombre_cientifico})`}
          className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          priority={prioridad}
          textoVacio={textoVacio}
        />
        {e.familia === "Saturniidae" ? (
          <span className="absolute left-3 top-3 bg-papel/90 px-2 py-0.5 text-xs text-tinta">{polilla}</span>
        ) : null}
      </div>
      <h2 className="titulo-3 mt-4 transition-colors group-hover:text-morpho">{e.nombre_comun}</h2>
      <p className="cientifico mt-0.5 text-sm text-pizarra">{e.nombre_cientifico}</p>
      <p className="datos mt-2 text-xs text-pizarra">
        {e.familia}
        {e.envergadura ? ` · ${e.envergadura}` : ""}
      </p>
    </Link>
  );
}
