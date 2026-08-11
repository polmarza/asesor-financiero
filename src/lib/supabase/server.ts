import { createClient } from '@supabase/supabase-js';

// Cliente de servidor, con la clave de servicio: salta RLS por diseño.
// Solo se importa desde rutas de servidor (app/api/**). Son ellas quienes
// validan el token de la entrevista antes de leer o escribir — la base de
// datos no tiene ninguna política para el rol anónimo.
//
// No es un singleton exportado a nivel de módulo a propósito: cada ruta pide
// su propio cliente para que quede claro, en el punto de uso, que se está
// usando la clave que salta la seguridad.
export function crearClienteServidor() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
