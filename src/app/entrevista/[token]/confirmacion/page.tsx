import Link from 'next/link';
import { crearClienteServidor } from '@/lib/supabase/server';
import { obtenerFichaEntrevista } from '@/lib/fichas';
import { Resumen } from './resumen';

export default async function PaginaConfirmacion({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = crearClienteServidor();

  const { data: entrevista } = await supabase
    .from('entrevistas')
    .select('id, estado')
    .eq('token', token)
    .maybeSingle<{ id: string; estado: string }>();

  if (!entrevista) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Este enlace no es válido
        </h1>
        <Link href="/consentimiento" className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background">
          Empezar una entrevista nueva
        </Link>
      </div>
    );
  }

  if (entrevista.estado === 'en_curso') {
    await supabase.from('entrevistas').update({ estado: 'pendiente_confirmacion' }).eq('id', entrevista.id);
  }

  const ficha = await obtenerFichaEntrevista(supabase, entrevista.id);
  const datos = ficha?.datos ?? null;

  return <Resumen token={token} datosIniciales={datos} yaCompletada={entrevista.estado === 'completada'} />;
}
