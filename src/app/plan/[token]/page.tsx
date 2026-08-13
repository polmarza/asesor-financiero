import Link from 'next/link';
import { crearClienteServidor } from '@/lib/supabase/server';
import type { SeccionesPlan } from '@/types/plan';

const SECCIONES: Array<{ clave: keyof SeccionesPlan; titulo: string }> = [
  { clave: 'tuMeta', titulo: '1. Tu meta' },
  { clave: 'tuFotoDeHoy', titulo: '2. Tu foto de hoy' },
  { clave: 'llegasSiSiguesAsi', titulo: '3. ¿Llegas si sigues así?' },
  { clave: 'tuPlanPasoAPaso', titulo: '4. Tu plan, paso a paso' },
  { clave: 'siLosNumerosNoSalen', titulo: '5. Si los números no salen: tus opciones' },
  { clave: 'deCada100Futuros', titulo: '6. De cada 100 futuros posibles…' },
  { clave: 'loQueMeFaltaSaber', titulo: '7. Lo que me falta saber' },
];

export default async function PaginaPlan({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = crearClienteServidor();

  const { data: entrevista } = await supabase
    .from('entrevistas')
    .select('id')
    .eq('token', token)
    .maybeSingle<{ id: string }>();

  if (!entrevista) {
    return <Mensaje titulo="Este enlace no es válido" texto="Puede que el enlace esté mal escrito." />;
  }

  const { data: ficha } = await supabase
    .from('fichas')
    .select('id')
    .eq('entrevista_id', entrevista.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  const { data: analisis } = ficha
    ? await supabase
        .from('analisis')
        .select('id')
        .eq('ficha_id', ficha.id)
        .order('calculado_en', { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>()
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

  if (!plan) {
    return (
      <Mensaje
        titulo="Tu plan está en camino"
        texto="Todavía no lo tenemos listo. Si acabas de confirmar tus datos, dale un momento y recarga esta página."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8 dark:bg-black sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">Tu plan</h1>

      <div className="flex flex-col gap-3">
        {SECCIONES.filter(({ clave }) => plan.secciones[clave]).map(({ clave, titulo }) => (
          <details
            key={clave}
            className="group rounded-xl border border-zinc-200 bg-white open:pb-4 dark:border-zinc-800 dark:bg-zinc-950"
            open
          >
            <summary className="cursor-pointer list-none px-4 py-3 text-base font-medium text-zinc-900 dark:text-zinc-100">
              {titulo}
            </summary>
            <p className="whitespace-pre-line px-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {plan.secciones[clave]}
            </p>
          </details>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">8. La letra pequeña honesta</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-500">{plan.descargo}</p>
      </div>
    </div>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">{titulo}</h1>
      <p className="max-w-sm text-base leading-7 text-zinc-600 dark:text-zinc-400">{texto}</p>
      <Link href="/" className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background">
        Volver al inicio
      </Link>
    </div>
  );
}
