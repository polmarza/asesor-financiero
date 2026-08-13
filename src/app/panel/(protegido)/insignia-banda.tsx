import type { BandaProbabilidad } from '@/lib/motor/supuestos';

// R10: el único sitio de la aplicación donde el color hace de semáforo
// (docs/design-system.md). Siempre acompañado de texto — nunca solo color.
const ESTILO_BANDA: Record<BandaProbabilidad, string> = {
  Alta: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Razonable: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400',
  Frágil: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Baja: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400',
};

const ETIQUETA_MODO: Record<string, string> = {
  suspendido: 'Suspendido',
  condicionado: 'Condicionado',
};

export function InsigniaBanda({ banda, modo }: { banda: BandaProbabilidad | null; modo: string | null }) {
  if (banda) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ESTILO_BANDA[banda]}`}>{banda}</span>
    );
  }

  const etiqueta = modo ? (ETIQUETA_MODO[modo] ?? modo) : 'Sin diagnóstico';
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
      {etiqueta}
    </span>
  );
}
