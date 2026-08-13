import type { Dato, Deudas } from '@/lib/motor/ficha';
import type { ClaveFicha } from '@/types/ficha';

// Traducción de cada clave a lenguaje llano para la pantalla de confirmación
// (docs/design-system.md: "una lista de frases que se pueden corregir", no
// un formulario técnico).
export const ETIQUETA_CAMPO: Record<ClaveFicha, string> = {
  objetivoDescripcion: 'Tu meta',
  objetivoCifra: 'Cantidad que quieres alcanzar',
  objetivoPlazo: 'En cuántos años',
  ingresosNetosMes: 'Lo que ingresas al mes',
  ingresosEstabilidad: '¿Tus ingresos son fijos o variables?',
  gastoTotalMes: 'Lo que gastas al mes',
  aportacionMensualActual: 'Lo que ya ahorras o inviertes al mes',
  patrimonioTotal: 'Lo que ya tienes ahorrado o invertido',
  patrimonioDistribucion: 'Dónde está ese dinero',
  deudas: 'Tus deudas',
  colchonMeses: 'Meses que aguantarías sin ingresos',
  riesgoExperiencia: 'Tu experiencia invirtiendo',
  riesgoEscenario: 'Qué harías si tu inversión bajara un 20%',
  riesgoPerfilDerivado: 'Tu perfil de riesgo',
};

const SUFIJO: Partial<Record<ClaveFicha, string>> = {
  objetivoCifra: '€',
  objetivoPlazo: 'años',
  ingresosNetosMes: '€/mes',
  gastoTotalMes: '€/mes',
  aportacionMensualActual: '€/mes',
  patrimonioTotal: '€',
  colchonMeses: 'meses',
};

export type TipoCampo =
  | 'numero'
  | 'texto'
  | 'estabilidad'
  | 'escenario'
  | 'perfil'
  | 'deudas';

const TIPO_CAMPO: Record<ClaveFicha, TipoCampo> = {
  objetivoDescripcion: 'texto',
  objetivoCifra: 'numero',
  objetivoPlazo: 'numero',
  ingresosNetosMes: 'numero',
  ingresosEstabilidad: 'estabilidad',
  gastoTotalMes: 'numero',
  aportacionMensualActual: 'numero',
  patrimonioTotal: 'numero',
  patrimonioDistribucion: 'texto',
  deudas: 'deudas',
  colchonMeses: 'numero',
  riesgoExperiencia: 'texto',
  riesgoEscenario: 'escenario',
  riesgoPerfilDerivado: 'perfil',
};

export function tipoCampo(clave: ClaveFicha): TipoCampo {
  return TIPO_CAMPO[clave];
}

export const OPCIONES_ESTABILIDAD = ['fijos', 'variables'] as const;
export const OPCIONES_ESCENARIO = ['vender', 'aguantar', 'comprar'] as const;
export const OPCIONES_PERFIL = ['conservador', 'moderado', 'dinamico'] as const;

// Deudas no se edita en esta pantalla: su forma es un objeto, no una frase, y
// forzarla a un campo de texto perdería la estructura que necesita el motor.
// Se corrige, si hace falta, retomando la conversación.
function formatearDeudas(valor: Deudas | null): string {
  if (!valor) return 'Sin datos.';
  switch (valor.tipo) {
    case 'ninguna':
      return 'Sin deudas.';
    case 'pendiente':
      return 'Prefirió no dar este dato.';
    case 'solo_flag':
      return valor.hayInteresAlto
        ? 'Tiene alguna deuda con interés alto (más del 8%), sin más detalle.'
        : 'No tiene ninguna deuda con interés alto, sin más detalle.';
    case 'lista':
      if (valor.deudas.length === 0) return 'Sin deudas.';
      return valor.deudas
        .map((d) => {
          const cuota = d.cuota !== null ? `${d.cuota} €/mes` : 'cuota no indicada';
          const interes = d.interes !== null ? `al ${d.interes}%` : 'interés no indicado';
          const saldo = d.saldo !== null ? `, saldo pendiente ${d.saldo} €` : ', saldo pendiente no indicado';
          return `${d.tipo}: ${cuota} ${interes}${saldo}`;
        })
        .join(' · ');
  }
}

export function formatearValor(clave: ClaveFicha, dato: Dato<unknown> | undefined): string {
  if (!dato || dato.valor === null || dato.valor === undefined) return 'Pendiente';
  if (clave === 'deudas') return formatearDeudas(dato.valor as Deudas);
  const sufijo = SUFIJO[clave];
  if (typeof dato.valor === 'number') {
    // es-ES no agrupa por miles en números de 4 cifras por defecto
    // (docs/testing.md); useGrouping:'always' iguala el formato del motor.
    const numero = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(dato.valor);
    return sufijo ? `${numero} ${sufijo}` : numero;
  }
  return String(dato.valor);
}

export function validarValorParaClave(clave: ClaveFicha, valor: unknown): boolean {
  const tipo = tipoCampo(clave);
  if (tipo === 'numero') return typeof valor === 'number' && Number.isFinite(valor);
  if (tipo === 'texto') return typeof valor === 'string' && valor.trim().length > 0;
  if (tipo === 'estabilidad') return OPCIONES_ESTABILIDAD.includes(valor as (typeof OPCIONES_ESTABILIDAD)[number]);
  if (tipo === 'escenario') return OPCIONES_ESCENARIO.includes(valor as (typeof OPCIONES_ESCENARIO)[number]);
  if (tipo === 'perfil') return OPCIONES_PERFIL.includes(valor as (typeof OPCIONES_PERFIL)[number]);
  return false;
}
