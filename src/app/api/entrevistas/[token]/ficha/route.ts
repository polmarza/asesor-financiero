import { crearClienteServidor } from '@/lib/supabase/server';
import { guardarDatoEnFicha } from '@/lib/fichas';
import { CLAVES_FICHA, type ClaveFicha } from '@/types/ficha';
import { tipoCampo, validarValorParaClave } from '@/lib/formato-ficha';

// Fase 6: la pantalla de confirmación corrige un dato. Toda corrección pasa
// a `confirmado` (docs/roadmap.md, Fase 6) — es la última red contra datos
// mal capturados, así que lo que el cliente confirma aquí manda.
export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const cuerpo = await request.json().catch(() => null);
  const clave = cuerpo?.clave as string | undefined;
  const valor = cuerpo?.valor;

  if (!clave || !CLAVES_FICHA.includes(clave as ClaveFicha) || clave === 'deudas') {
    return Response.json({ error: 'Clave inválida.' }, { status: 400 });
  }
  if (!validarValorParaClave(clave as ClaveFicha, valor)) {
    return Response.json({ error: `Valor inválido para ${clave} (tipo esperado: ${tipoCampo(clave as ClaveFicha)}).` }, { status: 400 });
  }

  const supabase = crearClienteServidor();

  const { data: entrevista } = await supabase
    .from('entrevistas')
    .select('id, cliente_id')
    .eq('token', token)
    .maybeSingle<{ id: string; cliente_id: string | null }>();

  if (!entrevista || !entrevista.cliente_id) {
    return Response.json({ error: 'Entrevista no encontrada.' }, { status: 404 });
  }

  const resultado = await guardarDatoEnFicha(
    supabase,
    entrevista.id,
    entrevista.cliente_id,
    clave,
    valor,
    'confirmado',
    undefined,
    undefined,
  );

  if (!resultado.ok) {
    return Response.json({ error: resultado.error }, { status: 500 });
  }

  return Response.json({ datos: resultado.datos });
}
