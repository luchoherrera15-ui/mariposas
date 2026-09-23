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
}: {
  slug: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!slug || !creditos[slug]) {
    return <div className={`marco-foto ${className}`} aria-hidden />;
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
