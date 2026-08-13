import type { Ficha, TipoMeta } from '@/lib/motor/ficha';

// §3 de docs/criterio/instrucciones-motor.md. Esto NO es un cálculo
// financiero — es categorizar texto ya capturado, así que vive en la capa de
// aplicación, no en el motor. Heurística por palabras clave sobre
// `objetivoDescripcion`: en la práctica, la plantilla de entrevista pide una
// cifra objetivo en términos de patrimonio salvo que el cliente describa
// explícitamente una renta o un negocio, así que 'patrimonio' es el default.
const PALABRAS_NEGOCIO = ['negocio', 'empresa', 'facturaci', 'autónomo', 'autonomo', 'mi propio', 'clientes'];
const PALABRAS_RENTA = ['renta mensual', 'vivir de las rentas', 'renta de', 'ingreso mensual', 'al mes de renta'];

export function clasificarMeta(ficha: Ficha): TipoMeta {
  const descripcion = (ficha.objetivoDescripcion.valor ?? '').toLowerCase();
  const esNegocio = PALABRAS_NEGOCIO.some((p) => descripcion.includes(p));
  const esRenta = PALABRAS_RENTA.some((p) => descripcion.includes(p));

  if (esNegocio && esRenta) return 'mixta';
  if (esNegocio) return 'renta_negocio';
  if (esRenta) return 'renta_cartera';
  return 'patrimonio';
}
