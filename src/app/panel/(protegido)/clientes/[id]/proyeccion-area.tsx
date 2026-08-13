'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { PuntoProyeccion } from '@/types/analisis';

const euros = (n: number) => new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(Math.round(n));

export function ProyeccionArea({ puntos }: { puntos: PuntoProyeccion[] }) {
  // Recharts apila áreas: para pintar la horquilla p10–p90 sin colorear
  // desde cero, se dibuja p10 como base invisible y encima el rango p90−p10.
  const datos = puntos.map((p) => ({
    anios: p.anios,
    p10: Math.round(p.p10),
    rango: Math.round(p.p90 - p.p10),
    p50: Math.round(p.p50),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
          <XAxis dataKey="anios" tickFormatter={(v) => `${v} a`} className="text-xs" />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} className="text-xs" width={40} />
          <Tooltip
            formatter={(valor, nombre) =>
              nombre === 'p50'
                ? [`${euros(Number(valor))} €`, 'Escenario central']
                : [`${euros(Number(valor))} €`, String(nombre)]
            }
            labelFormatter={(v) => `Año ${v}`}
          />
          <Area type="monotone" dataKey="p10" stackId="banda" stroke="none" fill="transparent" />
          <Area
            type="monotone"
            dataKey="rango"
            stackId="banda"
            name="Horquilla p10–p90"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.2}
          />
          <Area type="monotone" dataKey="p50" name="p50" stroke="#2563eb" fill="none" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
