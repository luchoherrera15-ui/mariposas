import Image from "next/image";
import { creditos } from "@/lib/fotos";

/**
 * Foto de especie con su marco. El crédito de autor y licencia se acumula en
 * /creditos, que es lo que exigen las licencias CC de Wikimedia Commons.
 */
export default function Foto({
  slug,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  textoVacio,
}: {
  slug: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Se muestra en el marco cuando la especie todavía no tiene foto. */
  textoVacio?: string;
}) {
  if (!slug || !creditos[slug]) {
    return (
      <div className={`marco-foto grid place-items-center ${className}`} aria-hidden={!textoVacio}>
        {textoVacio ? <span className="datos text-xs text-pizarra">{textoVacio}</span> : null}
      </div>
    );
  }
  return (
    <div className={`marco-foto relative ${className}`}>
      <Image
        src={`/fotos/${slug}.jpg`}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
