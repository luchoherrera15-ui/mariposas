"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseSchema, supabaseUrl } from "./config";

/** Cliente de Supabase para componentes de cliente. */
export function supabaseNavegador() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, { db: { schema: supabaseSchema } });
}
