'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BLOQUES, CLAVES_FICHA, type ClaveFicha, type DatosFicha } from '@/types/ficha';
import { LETRA_PEQUENA } from '@/types/plan';
import {
  ETIQUETA_CAMPO,
  formatearValor,
  tipoCampo,
  OPCIONES_ESTABILIDAD,
  OPCIONES_ESCENARIO,
  OPCIONES_PERFIL,
} from '@/lib/formato-ficha';

const ETIQUETA_ESTILO: Record<string, string> = {
  confirmado: 'text-zinc-500 dark:text-zinc-500',
  estimado: 'text-amber-700 dark:text-amber-500',
  pendiente: 'text-zinc-400 italic dark:text-zinc-600',
};

const ETIQUETA_TEXTO: Record<string, string> = {
  confirmado: 'confirmado',
  estimado: 'estimado',
  pendiente: 'pendiente — pincha para rellenarlo',
};

export function Resumen({
  token,
  datosIniciales,
  yaCompletada,
}: {
  token: string;
  datosIniciales: DatosFicha | null;
  yaCompletada: boolean;
}) {
  const router = useRouter();
  const [datos, setDatos] = useState<DatosFicha | null>(datosIniciales);
  const [editando, setEditando] = useState<ClaveFicha | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    if (yaCompletada) router.replace(`/plan/${token}`);
  }, [yaCompletada, router, token]);

  function empezarEdicion(clave: ClaveFicha) {
    const dato = datos?.[clave];
    const valorActual = dato && dato.valor !== null ? String(dato.valor) : '';
    setValorEdicion(valorActual);
    setEditando(clave);
    setError(null);
  }

  async function guardar(clave: ClaveFicha) {
    const tipo = tipoCampo(clave);
    const valor = tipo === 'numero' ? Number(valorEdicion) : valorEdicion.trim();

    if (tipo === 'numero' && !Number.isFinite(valor)) {
      setError('Escribe un número válido.');
      return;
    }
    if (tipo !== 'numero' && !String(valor).trim()) {
      setError('No puede quedar vacío.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/entrevistas/${token}/ficha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, valor }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setError(cuerpo.error ?? 'No se pudo guardar.');
        return;
      }
      setDatos(cuerpo.datos);
      setEditando(null);
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarTodo() {
    setCerrando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/entrevistas/${token}/confirmar`, { method: 'POST' });
      if (!respuesta.ok) {
        setError('No se pudo confirmar. Inténtalo de nuevo.');
        setCerrando(false);
        return;
      }
      router.push(`/plan/${token}`);
    } catch {
      setError('No se pudo conectar. Inténtalo de nuevo.');
      setCerrando(false);
    }
  }

  if (yaCompletada) return null;

  const pendientes = CLAVES_FICHA.filter((c) => datos?.[c] === undefined).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 bg-zinc-50 px-4 py-8 dark:bg-black sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">Revisa lo que nos has contado</h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Pincha en cualquier dato para corregirlo. Al guardarlo, queda confirmado.
        </p>
        {pendientes > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-500">
            Te falta rellenar {pendientes} dato{pendientes === 1 ? '' : 's'} — puedes hacerlo aquí mismo.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {BLOQUES.map((bloque) => (
          <section key={bloque.numero} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
              {bloque.numero}. {bloque.titulo}
            </h2>
            <div className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {bloque.claves.map((clave) => {
                const dato = datos?.[clave];
                const etiqueta = dato?.etiqueta ?? 'pendiente';
                const editable = clave !== 'deudas';
                const tipo = tipoCampo(clave);

                return (
                  <div key={clave} className="flex flex-col gap-1 px-4 py-3">
                    <span className="text-sm text-zinc-500 dark:text-zinc-500">{ETIQUETA_CAMPO[clave]}</span>

                    {editando === clave ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {tipo === 'estabilidad' || tipo === 'escenario' || tipo === 'perfil' ? (
                          <select
                            value={valorEdicion}
                            onChange={(e) => setValorEdicion(e.target.value)}
                            className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            <option value="" disabled>
                              Elige una opción
                            </option>
                            {(tipo === 'estabilidad'
                              ? OPCIONES_ESTABILIDAD
                              : tipo === 'escenario'
                                ? OPCIONES_ESCENARIO
                                : OPCIONES_PERFIL
                            ).map((opcion) => (
                              <option key={opcion} value={opcion}>
                                {opcion}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={tipo === 'numero' ? 'number' : 'text'}
                            value={valorEdicion}
                            onChange={(e) => setValorEdicion(e.target.value)}
                            autoFocus
                            className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() => guardar(clave)}
                            className="h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditando(null)}
                            className="h-11 rounded-lg border border-zinc-300 px-4 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => editable && empezarEdicion(clave)}
                        className={`text-left text-base leading-6 text-zinc-900 dark:text-zinc-100 ${editable ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                      >
                        {formatearValor(clave, dato)}
                        <span className={`ml-2 text-xs ${ETIQUETA_ESTILO[etiqueta]}`}>{ETIQUETA_TEXTO[etiqueta]}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-500">{LETRA_PEQUENA}</p>

      <button
        type="button"
        disabled={cerrando}
        onClick={confirmarTodo}
        className="h-12 w-full rounded-full bg-foreground px-5 text-base font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        {cerrando ? 'Preparando tu plan…' : 'Confirmar y continuar'}
      </button>
    </div>
  );
}
