export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Schema de Postgres donde viven las tablas del sitio. El proyecto de Supabase
 * se comparte con otra app, así que todo va en "mariposas" en vez de "public".
 */
export const supabaseSchema = "mariposas";

/** true cuando .env.local tiene credenciales reales (no los placeholders). */
export const haySupabase =
  supabaseUrl.startsWith("https://") &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.startsWith("pega-aqui");

/**
 * En modo demo el sitio funciona con datos de ejemplo en memoria: sirve para
 * ver y mostrar todo el flujo antes de correr las migraciones. Se activa solo
 * si falta Supabase, o a mano con NEXT_PUBLIC_DEMO_DATA=true.
 */
export const modoDemo = !haySupabase || process.env.NEXT_PUBLIC_DEMO_DATA === "true";

export const marca = {
  nombre: "Tropical Butterfly Exports",
  descripcionCorta:
    "Comercialización y exportación de mariposas tropicales vivas desde Costa Rica, con impacto social medible.",
  correo: "ventas@tropicalbutterflyexports.com",
  telefono: "+506 8710 3739",
  ubicacion: "San Rafael de Alajuela, Costa Rica",
};
