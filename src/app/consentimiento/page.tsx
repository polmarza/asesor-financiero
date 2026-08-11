'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Consentimiento() {
  const router = useRouter();
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function empezar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch('/api/entrevistas', { method: 'POST' });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setError(cuerpo.error ?? 'No se pudo empezar la entrevista.');
        return;
      }
      router.push(`/entrevista/${cuerpo.token}`);
    } catch {
      setError('No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Antes de empezar
          </h1>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Vamos a hacerte unas preguntas sobre tu situación financiera. Esto
            es lo que necesitas saber antes de contarnos nada.
          </p>
        </div>

        <ul className="flex flex-col gap-3 text-base leading-7 text-zinc-700 dark:text-zinc-300">
          <li>
            Tus respuestas se usan para calcular tu diagnóstico financiero:
            dónde estás hoy y si vas a llegar a tu meta.
          </li>
          <li>
            El correo que nos dejes también sirve para que un asesor pueda
            contactarte más adelante, si quieres.
          </li>
          <li>
            No necesitas cifras exactas: con aproximaciones vale. Y puedes
            cerrar esta pestaña en cualquier momento y volver luego con el
            mismo enlace.
          </li>
        </ul>

        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-500">
          Esto es orientación educativa hecha con tus números, no
          asesoramiento financiero regulado. Nunca te recomendará productos
          concretos ni prometerá una rentabilidad.
        </p>

        <label className="flex items-start gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(evento) => setAcepta(evento.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          He leído lo anterior y acepto que se traten mis datos para el
          diagnóstico y para que un asesor pueda contactarme.
        </label>

        {error && (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!acepta || enviando}
          onClick={empezar}
          className="h-12 w-full rounded-full bg-foreground px-5 text-base font-medium text-background transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Un momento…' : 'Acepto y empiezo'}
        </button>
      </div>
    </div>
  );
}
