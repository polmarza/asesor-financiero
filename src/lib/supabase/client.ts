import { createBrowserClient } from '@supabase/ssr';

// Cliente público, con la clave anónima. Solo lo usa el panel de la asesora
// para el login con Supabase Auth: el resto del acceso a datos pasa por RLS
// (es_asesor()) o por rutas de servidor. El cliente de la entrevista NUNCA
// usa esto — ver src/lib/supabase/server.ts.
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
