import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseSchema, supabaseUrl } from "./config";

/**
 * Cliente de Supabase para Server Components y Server Actions: mantiene la
 * sesión del usuario en cookies y respeta RLS (actúa como el usuario).
 */
export async function supabaseServidor() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: supabaseSchema },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component sin permiso de escribir cookies: las refresca el middleware.
        }
      },
    },
  });
}

/**
 * Cliente con service role: SOLO en el servidor. Salta RLS, así que nunca debe
 * exponerse al navegador. Se usa para los scripts de administración.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  return createClient(supabaseUrl, key, {
    db: { schema: supabaseSchema },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
