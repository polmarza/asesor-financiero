import type { SupabaseClient } from '@supabase/supabase-js';
import type { Dato, Etiqueta } from '@/lib/motor/ficha';
import { CLAVES_FICHA, type ClaveFicha, type DatosFicha } from '@/types/ficha';

interface FilaFicha {
  id: string;
  datos: DatosFicha;
}

export async function obtenerFichaEntrevista(
  supabase: SupabaseClient,
  entrevistaId: string,
): Promise<FilaFicha | null> {
  const { data } = await supabase
    .from('fichas')
    .select('id, datos')
    .eq('entrevista_id', entrevistaId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle<FilaFicha>();
  return data;
}

// Columnas denormalizadas que el listado del panel necesita filtrar/ordenar
// sin abrir el jsonb (docs/data-model.md «Campos denormalizados»). Se
// escriben en el mismo momento que el dato correspondiente.
function columnasDenormalizadas(clave: ClaveFicha, dato: Dato<unknown>): Record<string, unknown> {
  if (dato.valor === null) return {};
  switch (clave) {
    case 'objetivoDescripcion':
      return { objetivo_descripcion: dato.valor };
    case 'objetivoCifra':
      return { objetivo_cifra: dato.valor };
    case 'objetivoPlazo':
      return { objetivo_plazo: dato.valor };
    case 'riesgoPerfilDerivado':
      return { perfil: dato.valor };
    default:
      return {};
  }
}

// Fase 5 · Extracción turno a turno (docs/architecture.md, decisión 3): cada
// vez que el modelo resuelve una variable llama a `guardar_dato`, y esto la
// escribe al momento en `fichas` — no se espera a que acabe la conversación.
export async function guardarDatoEnFicha(
  supabase: SupabaseClient,
  entrevistaId: string,
  clienteId: string,
  clave: string,
  valor: unknown,
  etiqueta: string,
  cita: string | undefined,
  supuesto: string | undefined,
): Promise<{ ok: true; datos: DatosFicha } | { ok: false; error: string }> {
  if (!CLAVES_FICHA.includes(clave as ClaveFicha)) {
    return { ok: false, error: `Clave desconocida. Usa una de: ${CLAVES_FICHA.join(', ')}` };
  }
  if (!['confirmado', 'estimado', 'pendiente'].includes(etiqueta)) {
    return { ok: false, error: "Etiqueta inválida. Usa 'confirmado', 'estimado' o 'pendiente'." };
  }

  const claveTipada = clave as ClaveFicha;
  const dato: Dato<unknown> = { valor, etiqueta: etiqueta as Etiqueta, cita, supuesto };

  const existente = await obtenerFichaEntrevista(supabase, entrevistaId);
  const denormalizado = columnasDenormalizadas(claveTipada, dato);

  if (!existente) {
    const datos: DatosFicha = { [claveTipada]: dato } as DatosFicha;
    const pendientes = etiqueta === 'pendiente' ? [claveTipada] : [];
    const { error } = await supabase
      .from('fichas')
      .insert({ cliente_id: clienteId, entrevista_id: entrevistaId, version: 1, datos, pendientes, ...denormalizado });
    if (error) return { ok: false, error: 'No se pudo guardar el dato.' };
    return { ok: true, datos };
  }

  const datos: DatosFicha = { ...existente.datos, [claveTipada]: dato };
  const pendientes = CLAVES_FICHA.filter((c) => datos[c]?.etiqueta === 'pendiente');
  const { error } = await supabase
    .from('fichas')
    .update({ datos, pendientes, ...denormalizado })
    .eq('id', existente.id);
  if (error) return { ok: false, error: 'No se pudo guardar el dato.' };
  return { ok: true, datos };
}

// Resumen inyectado en el prompt en cada turno: lo que ya está capturado, para
// que el modelo no repregunte y respete el rebote ya gastado.
export function construirEstadoFicha(datos: DatosFicha | null): string {
  if (!datos || Object.keys(datos).length === 0) {
    return 'Todavía no hay ningún dato capturado.';
  }
  const lineas = CLAVES_FICHA.filter((clave) => datos[clave] !== undefined).map((clave) => {
    const dato = datos[clave] as Dato<unknown>;
    const valorTexto = dato.valor === null ? 'sin valor' : JSON.stringify(dato.valor);
    const extra = dato.supuesto ? ` (supuesto: ${dato.supuesto})` : '';
    return `- ${clave}: [${dato.etiqueta}] ${valorTexto}${extra}`;
  });
  return lineas.join('\n');
}
