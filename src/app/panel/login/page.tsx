'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';

// Sin registro, sin enlace desde la landing: la única puerta de entrada al
// panel es conocer esta URL. No hay página de alta porque Marta es la única
// asesora y su cuenta ya existe en Supabase Auth.
export default function LoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    const supabase = crearClienteNavegador();
    const { error: errorLogin } = await supabase.auth.signInWithPassword({ email, password });

    if (errorLogin) {
      setError('Correo o contraseña incorrectos.');
      setEnviando(false);
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <form onSubmit={entrar} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Acceso</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          required
          className="h-12 rounded-lg border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          className="h-12 rounded-lg border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        {error && (
          <p className="text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="h-12 rounded-full bg-foreground px-5 text-base font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
