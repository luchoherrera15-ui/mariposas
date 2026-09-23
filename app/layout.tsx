import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Spectral } from "next/font/google";
import { obtenerMarca } from "@/lib/ajustes";
import { obtenerIdioma, obtenerTextos } from "@/lib/i18n/servidor";
import "./globals.css";

// Spectral: serif de texto con dibujo científico-editorial. En peso 200/300 a
// tamaño grande sostiene los titulares sin gritar.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

// Solo para datos duros: guías, códigos de pedido, temperaturas.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [marca, t] = await Promise.all([obtenerMarca(), obtenerTextos()]);
  return {
    title: {
      default: `${marca.nombre} — ${t.meta.lema}`,
      template: `%s · ${marca.nombre}`,
    },
    description: marca.descripcionCorta,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const idioma = await obtenerIdioma();
  return (
    <html
      lang={idioma === "zh" ? "zh-CN" : idioma}
      className={`${spectral.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
