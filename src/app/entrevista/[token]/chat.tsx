'use client';

import { useState, useRef, useEffect } from 'react';
import type { Mensaje } from '@/types/mensaje';

export function Chat({ token, mensajesIniciales }: { token: string; mensajesIniciales: Mensaje[] }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  async function enviar() {
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    const mensajeOptimista: Mensaje = {
      id: Date.now(),
      rol: 'cliente',
      contenido,
      creado_en: new Date().toISOString(),
    };
    setMensajes((previos) => [...previos, mensajeOptimista]);
    setTexto('');
    setEnviando(true);
    setError(null);

    try {
      const respuesta = await fetch(`/api/entrevistas/${token}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: contenido }),
      });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setError(cuerpo.error ?? 'No se pudo enviar el mensaje.');
        return;
      }

      setMensajes((previos) => [
        ...previos,
        { id: Date.now() + 1, rol: 'agente', contenido: cuerpo.respuesta, creado_en: new Date().toISOString() },
      ]);
    } catch {
      setError('No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-6 sm:max-w-[70%] ${
              mensaje.rol === 'agente'
                ? 'self-start bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'
                : 'self-end bg-foreground text-background'
            }`}
          >
            {mensaje.contenido}
          </div>
        ))}
        {enviando && (
          <div className="self-start rounded-2xl bg-white px-4 py-3 text-base text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600">
            Escribiendo…
          </div>
        )}
        <div ref={finRef} />
      </div>

      {error && (
        <p className="px-4 pb-2 text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar();
        }}
        className="flex gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black"
      >
        <input
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Escribe tu respuesta…"
          disabled={enviando}
          className="h-12 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="h-12 rounded-full bg-foreground px-5 text-base font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
