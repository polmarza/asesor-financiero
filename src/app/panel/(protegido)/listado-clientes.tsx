'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { FilaCliente } from '@/types/panel';
import { ORDEN_BANDA } from '@/types/panel';
import { InsigniaBanda } from './insignia-banda';

type Direccion = 'asc' | 'desc';

export function ListadoClientes({ filas }: { filas: FilaCliente[] }) {
  const [direccion, setDireccion] = useState<Direccion>('asc');

  const ordenadas = useMemo(() => {
    const copia = [...filas];
    copia.sort((a, b) => {
      const claveA = ORDEN_BANDA[a.banda ?? 'sin_datos'];
      const claveB = ORDEN_BANDA[b.banda ?? 'sin_datos'];
      return direccion === 'asc' ? claveA - claveB : claveB - claveA;
    });
    return copia;
  }, [filas, direccion]);

  if (filas.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-500">Todavía no ha llegado ningún lead.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Meta</th>
            <th className="px-4 py-3 font-medium">Plazo</th>
            <th className="px-4 py-3 font-medium">
              <button
                type="button"
                onClick={() => setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'))}
                className="flex items-center gap-1 font-medium hover:underline"
              >
                Banda {direccion === 'asc' ? '↑' : '↓'}
              </button>
            </th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((fila) => (
            <tr key={fila.clienteId} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
              <td className="px-4 py-3">
                <Link href={`/panel/clientes/${fila.clienteId}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                  {fila.nombre}
                </Link>
                <div className="text-xs text-zinc-500 dark:text-zinc-500">{fila.email}</div>
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {fila.objetivoDescripcion ?? <span className="italic text-zinc-400 dark:text-zinc-600">pendiente</span>}
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {fila.objetivoPlazo !== null ? `${fila.objetivoPlazo} años` : '—'}
              </td>
              <td className="px-4 py-3">
                <InsigniaBanda banda={fila.banda} modo={fila.modo} />
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{fila.estadoEntrevista}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
