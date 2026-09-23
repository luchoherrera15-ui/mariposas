import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { modoDemo, supabaseAnonKey, supabaseUrl } from "@/lib/config";

/**
 * Refresca el token de Supabase en cada navegación para que la sesión no se
 * caiga en Server Components. En modo demo no hace nada.
 */
export async function proxy(request: NextRequest) {
  if (modoDemo) return NextResponse.next();

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (request.nextUrl.pathname.startsWith("/panel") || request.nextUrl.pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
