import type { ResultadoAnalisis } from '@/types/analisis';

// R1: orden estricto del ahorro (docs/criterio/reglas-recomendacion.md).
// Deriva el checklist de lo que ya está en `resultado` — no repregunta ni
// recalcula nada nuevo.
export function PrioridadesR1({ resultado }: { resultado: ResultadoAnalisis }) {
  const pasos = [
    {
      titulo: 'Cuotas de deuda al día',
      hecho: resultado.situacion.tieneDeudaCara !== null,
      detalle: resultado.situacion.tieneDeudaCara === null ? 'Sin dato' : 'Registrado',
    },
    {
      titulo: 'Colchón inicial (1 mes de gastos)',
      hecho: resultado.situacion.colchonMeses !== null && resultado.situacion.colchonMeses >= 1,
      detalle:
        resultado.situacion.colchonMeses !== null ? `${resultado.situacion.colchonMeses} meses cubiertos` : 'Sin dato',
    },
    {
      titulo: 'Cancelar deudas caras (>7-8% TAE)',
      hecho: resultado.situacion.tieneDeudaCara === false,
      detalle:
        resultado.situacion.tieneDeudaCara === true
          ? 'Tiene alguna — prioridad'
          : resultado.situacion.tieneDeudaCara === false
            ? 'No tiene'
            : 'Sin dato',
    },
    {
      titulo: 'Fondo de emergencia completo',
      hecho: resultado.situacion.colchonCompleto === true,
      detalle: resultado.situacion.colchonObjetivoMeses
        ? `Objetivo: ${resultado.situacion.colchonObjetivoMeses[0]}-${resultado.situacion.colchonObjetivoMeses[1]} meses`
        : 'Sin dato',
    },
    {
      titulo: 'Aumentar la inversión',
      hecho: resultado.aportacion !== null,
      detalle: resultado.aportacion ? `${Math.round(resultado.aportacion.propuesta)} €/mes propuestos` : 'Sin propuesta todavía',
    },
  ];

  return (
    <ul className="flex flex-col gap-2">
      {pasos.map((paso) => (
        <li key={paso.titulo} className="flex items-start gap-2 text-sm">
          <span
            aria-hidden
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
              paso.hecho
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500'
            }`}
          >
            {paso.hecho ? '✓' : '·'}
          </span>
          <span>
            <span className="text-zinc-900 dark:text-zinc-100">{paso.titulo}</span>
            <span className="ml-2 text-zinc-500 dark:text-zinc-500">{paso.detalle}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
