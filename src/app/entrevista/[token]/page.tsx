import Link from 'next/link';
import { crearClienteServidor } from '@/lib/supabase/server';
import { obtenerFichaEntrevista } from '@/lib/fichas';
import { calcularProgreso } from '@/types/ficha';
import type { Entrevista } from '@/types/entrevista';
import type { Mensaje } from '@/types/mensaje';
import { Chat } from './chat';

export default async function PaginaEntrevista({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = crearClienteServidor();

  const { data: entrevista } = await supabase
    .from('entrevistas')
    .select('id, cliente_id, estado, token, consentimiento_en, expira_en')
    .eq('token', token)
    .maybeSingle<Entrevista>();

  if (!entrevista) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Este enlace no es válido
        </h1>
        <p className="max-w-sm text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Puede que el enlace esté mal escrito o que la entrevista haya
          caducado. Puedes empezar una nueva desde el principio.
        </p>
        <Link
          href="/consentimiento"
          className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background"
        >
          Empezar una entrevista nueva
        </Link>
      </div>
    );
  }

  const caducada = new Date(entrevista.expira_en) < new Date();

  if (caducada) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Esta entrevista ha caducado
        </h1>
        <p className="max-w-sm text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Han pasado más de 30 días desde que la empezaste. Puedes hacer una
          nueva cuando quieras.
        </p>
        <Link
          href="/consentimiento"
          className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background"
        >
          Empezar una entrevista nueva
        </Link>
      </div>
    );
  }

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('id, rol, contenido, creado_en')
    .eq('entrevista_id', entrevista.id)
    .order('id', { ascending: true })
    .returns<Mensaje[]>();

  const ficha = await obtenerFichaEntrevista(supabase, entrevista.id);

  return (
    <Chat
      token={entrevista.token}
      mensajesIniciales={mensajes ?? []}
      progresoInicial={calcularProgreso(ficha?.datos ?? null)}
    />
  );
}
