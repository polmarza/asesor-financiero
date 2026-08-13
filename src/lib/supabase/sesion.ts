import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente con la sesión de Marta (clave pública + su JWT): las lecturas del
// panel pasan por RLS (es_asesor()), no por la clave de servicio. Distinto
// de src/lib/supabase/server.ts, que salta RLS a propósito para el chat del
// cliente. Aquí el acceso lo decide la base de datos, no el código.
export async function crearClienteSesion() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: no puede escribir cookies.
          // El middleware ya se encarga de refrescar la sesión.
        }
      },
    },
  });
}
