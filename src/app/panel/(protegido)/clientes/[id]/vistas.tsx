'use client';

import { useState } from 'react';
import type { DatosFicha } from '@/types/ficha';
import { BLOQUES } from '@/types/ficha';
import { ETIQUETA_CAMPO, formatearValor } from '@/lib/formato-ficha';
import type { ResultadoAnalisis } from '@/types/analisis';
import type { SeccionesPlan } from '@/types/plan';
import { ProbabilidadBanda } from './probabilidad-banda';
import { ComposicionCartera } from './composicion-cartera';
import { ProyeccionArea } from './proyeccion-area';
import { PrioridadesR1 } from './prioridades-r1';

type Pestana = 'diagnostico' | 'ficha' | 'plan';

const SECCIONES_PLAN: Array<{ clave: keyof SeccionesPlan; titulo: string }> = [
  { clave: 'tuMeta', titulo: '1. Tu meta' },
  { clave: 'tuFotoDeHoy', titulo: '2. Tu foto de hoy' },
  { clave: 'llegasSiSiguesAsi', titulo: '3. ¿Llegas si sigues así?' },
  { clave: 'tuPlanPasoAPaso', titulo: '4. Tu plan, paso a paso' },
  { clave: 'siLosNumerosNoSalen', titulo: '5. Si los números no salen: tus opciones' },
  { clave: 'deCada100Futuros', titulo: '6. De cada 100 futuros posibles…' },
  { clave: 'loQueMeFaltaSaber', titulo: '7. Lo que me falta saber' },
];

export function Vistas({
  datos,
  resultado,
  plan,
}: {
  datos: DatosFicha | null;
  resultado: ResultadoAnalisis | null;
  plan: { secciones: SeccionesPlan; descargo: string } | null;
}) {
  const [pestana, setPestana] = useState<Pestana>('diagnostico');

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {(
          [
            ['diagnostico', 'Diagnóstico'],
            ['ficha', 'Ficha cruda'],
            ['plan', 'Plan'],
          ] as const
        ).map(([clave, etiqueta]) => (
          <button
            key={clave}
            type="button"
            onClick={() => setPestana(clave)}
            className={`px-4 py-2 text-sm font-medium ${
              pestana === clave
                ? 'border-b-2 border-foreground text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 dark:text-zinc-500'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'diagnostico' && (
        <div>
          {!resultado ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Todavía no hay diagnóstico para este cliente.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-500">Probabilidad de cumplimiento</h2>
                {resultado.monteCarlo ? (
                  <ProbabilidadBanda monteCarlo={resultado.monteCarlo} />
                ) : (
                  <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-500">
                    {resultado.motivoSuspension ?? resultado.nota ?? 'Sin simulación todavía (faltan datos).'}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-500">Composición de la cartera</h2>
                {resultado.cartera ? (
                  <ComposicionCartera pesos={resultado.cartera.pesos} />
                ) : (
                  <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-500">Sin propuesta de cartera.</p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-2">
                <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-500">Proyección (euros de hoy)</h2>
                {resultado.proyeccionTemporal ? (
                  <ProyeccionArea puntos={resultado.proyeccionTemporal} />
                ) : (
                  <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-500">Sin proyección todavía.</p>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-2">
                <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-500">Prioridades (R1)</h2>
                <PrioridadesR1 resultado={resultado} />
              </div>
            </div>
          )}
        </div>
      )}

      {pestana === 'ficha' && (
        <div className="flex flex-col gap-4">
          {!datos ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Todavía no hay ficha para este cliente.</p>
          ) : (
            BLOQUES.map((bloque) => (
              <section key={bloque.numero} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  {bloque.numero}. {bloque.titulo}
                </h2>
                <div className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
                  {bloque.claves.map((clave) => {
                    const dato = datos[clave];
                    return (
                      <div key={clave} className="flex flex-col gap-1 px-4 py-3">
                        <span className="text-sm text-zinc-500 dark:text-zinc-500">{ETIQUETA_CAMPO[clave]}</span>
                        <span className="text-base text-zinc-900 dark:text-zinc-100">
                          {formatearValor(clave, dato)}
                          {dato?.etiqueta && <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-500">{dato.etiqueta}</span>}
                        </span>
                        {dato?.cita && <span className="text-xs italic text-zinc-500 dark:text-zinc-500">«{dato.cita}»</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {pestana === 'plan' && (
        <div className="flex flex-col gap-3">
          {!plan ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Todavía no hay plan para este cliente.</p>
          ) : (
            <>
              {SECCIONES_PLAN.filter(({ clave }) => plan.secciones[clave]).map(({ clave, titulo }) => (
                <div key={clave} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <h2 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{titulo}</h2>
                  <p className="whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-300">{plan.secciones[clave]}</p>
                </div>
              ))}
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-500">{plan.descargo}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
