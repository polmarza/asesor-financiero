import Link from 'next/link';
import { crearClienteSesion } from '@/lib/supabase/sesion';
import type { DatosFicha } from '@/types/ficha';
import type { ResultadoAnalisis } from '@/types/analisis';
import type { SeccionesPlan } from '@/types/plan';
import { Vistas } from './vistas';

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteSesion();

  const { data: cliente } = await supabase
    .from('clientes')
    .select('nombre, email')
    .eq('id', id)
    .maybeSingle<{ nombre: string; email: string }>();

  if (!cliente) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Cliente no encontrado</h1>
        <Link href="/panel" className="text-sm text-zinc-500 hover:underline dark:text-zinc-500">
          Volver al listado
        </Link>
      </div>
    );
  }

  const { data: ficha } = await supabase
    .from('fichas')
    .select('id, datos')
    .eq('cliente_id', id)
    .order('creada_en', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; datos: DatosFicha }>();

  const { data: analisis } = ficha
    ? await supabase
        .from('analisis')
        .select('id, resultado')
        .eq('ficha_id', ficha.id)
        .order('calculado_en', { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; resultado: ResultadoAnalisis }>()
    : { data: null };

  const { data: plan } = analisis
    ? await supabase
        .from('planes')
        .select('secciones, descargo')
        .eq('analisis_id', analisis.id)
        .order('generado_en', { ascending: false })
        .limit(1)
        .maybeSingle<{ secciones: SeccionesPlan; descargo: string }>()
    : { data: null };

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-6">
      <div>
        <Link href="/panel" className="text-sm text-zinc-500 hover:underline dark:text-zinc-500">
          ← Todos los clientes
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-black dark:text-zinc-50">{cliente.nombre}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">{cliente.email}</p>
      </div>

      <Vistas datos={ficha?.datos ?? null} resultado={analisis?.resultado ?? null} plan={plan ?? null} />
    </div>
  );
}
