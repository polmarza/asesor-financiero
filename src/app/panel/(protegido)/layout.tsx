import { redirect } from 'next/navigation';
import { crearClienteSesion } from '@/lib/supabase/sesion';

// Todo lo que cuelga de (protegido) exige sesión Y estar en `asesores` — es
// la propia tabla la que da el permiso (docs/data-model.md). El login vive
// fuera de este grupo de rutas para no entrar en el bucle de redirección.
export default async function LayoutProtegido({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteSesion();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/panel/login');

  const { data: asesor } = await supabase.from('asesores').select('nombre').eq('id', user.id).maybeSingle<{ nombre: string }>();

  if (!asesor) {
    await supabase.auth.signOut();
    redirect('/panel/login');
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-black">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Hola, {asesor.nombre}</span>
        <form action="/panel/salir" method="POST">
          <button type="submit" className="text-sm text-zinc-500 hover:underline dark:text-zinc-500">
            Salir
          </button>
        </form>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
