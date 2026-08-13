import { crearClienteSesion } from '@/lib/supabase/sesion';
import type { ResultadoAnalisis } from '@/types/analisis';
import type { FilaCliente } from '@/types/panel';
import { ListadoClientes } from './listado-clientes';

interface FilaFichaConRelaciones {
  cliente_id: string;
  objetivo_descripcion: string | null;
  objetivo_cifra: number | null;
  objetivo_plazo: number | null;
  perfil: FilaCliente['perfil'];
  creada_en: string;
  clientes: { nombre: string; email: string } | null;
  entrevistas: { estado: string } | null;
  analisis: { resultado: ResultadoAnalisis; calculado_en: string }[] | null;
}

export default async function PaginaPanel() {
  const supabase = await crearClienteSesion();

  const { data } = await supabase
    .from('fichas')
    .select(
      'cliente_id, objetivo_descripcion, objetivo_cifra, objetivo_plazo, perfil, creada_en, clientes ( nombre, email ), entrevistas ( estado ), analisis ( resultado, calculado_en )',
    )
    .order('creada_en', { ascending: false })
    .returns<FilaFichaConRelaciones[]>();

  const vistos = new Set<string>();
  const filas: FilaCliente[] = [];

  for (const ficha of data ?? []) {
    // Una fila por cliente: nos quedamos con su ficha más reciente
    // (ya vienen ordenadas por creada_en desc).
    if (vistos.has(ficha.cliente_id) || !ficha.clientes) continue;
    vistos.add(ficha.cliente_id);

    const ultimoAnalisis = (ficha.analisis ?? []).sort((a, b) => b.calculado_en.localeCompare(a.calculado_en))[0];

    filas.push({
      clienteId: ficha.cliente_id,
      nombre: ficha.clientes.nombre,
      email: ficha.clientes.email,
      objetivoDescripcion: ficha.objetivo_descripcion,
      objetivoCifra: ficha.objetivo_cifra,
      objetivoPlazo: ficha.objetivo_plazo,
      perfil: ficha.perfil,
      estadoEntrevista: ficha.entrevistas?.estado ?? 'en_curso',
      banda: ultimoAnalisis?.resultado.monteCarlo?.banda ?? null,
      probabilidadCumplimiento: ultimoAnalisis?.resultado.monteCarlo?.probabilidadCumplimiento ?? null,
      modo: ultimoAnalisis?.resultado.modo ?? null,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-6">
      <h1 className="text-xl font-semibold text-black dark:text-zinc-50">Tus clientes</h1>
      <ListadoClientes filas={filas} />
    </div>
  );
}
