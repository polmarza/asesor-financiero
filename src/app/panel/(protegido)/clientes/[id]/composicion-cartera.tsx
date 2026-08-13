'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Cartera } from '@/lib/motor/supuestos';

const NOMBRE_CLASE: Record<string, string> = {
  renta_variable: 'Bolsa mundial',
  renta_fija: 'Renta fija',
  liquidez: 'Liquidez',
  oro: 'Oro',
};

const COLOR_CLASE: Record<string, string> = {
  renta_variable: '#2563eb',
  renta_fija: '#16a34a',
  liquidez: '#eab308',
  oro: '#a855f7',
};

export function ComposicionCartera({ pesos }: { pesos: Cartera }) {
  const datos = Object.entries(pesos)
    .filter(([, peso]) => (peso ?? 0) > 0)
    .map(([clase, peso]) => ({ clase, nombre: NOMBRE_CLASE[clase] ?? clase, valor: Math.round((peso ?? 0) * 100) }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={datos} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {datos.map((d) => (
              <Cell key={d.clase} fill={COLOR_CLASE[d.clase] ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip formatter={(valor) => `${valor} de cada 100 €`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
