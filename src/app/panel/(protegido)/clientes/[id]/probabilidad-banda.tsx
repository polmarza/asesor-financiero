import type { ResultadoMonteCarlo } from '@/types/analisis';
import { InsigniaBanda } from '../../insignia-banda';

// El dato que resume todo (docs/design-system.md): la primera visualización
// de las cuatro.
export function ProbabilidadBanda({ monteCarlo }: { monteCarlo: ResultadoMonteCarlo }) {
  const porcentaje = Math.round(monteCarlo.probabilidadCumplimiento * 100);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <span className="text-4xl font-semibold text-zinc-900 dark:text-zinc-100">{porcentaje}%</span>
      <InsigniaBanda banda={monteCarlo.banda} modo="completo" />
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
        probabilidad de llegar a la meta, sobre 10.000 escenarios simulados
      </p>
    </div>
  );
}
