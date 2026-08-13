/**
 * ejecutar.ts — Orquesta el motor para una ficha (Fase 7 del roadmap).
 *
 * No es el motor: es la capa de aplicación que decide QUÉ funciones puras de
 * `src/lib/motor/calculos.ts` llamar y en qué orden, según el modo del
 * informe (R9) y el tipo de meta (§3). El motor no se toca ni se duplica —
 * solo se invoca. El motor original en Python tampoco resuelve «aportación
 * requerida»: como en `motor-calculos.py` y en el test de regresión
 * `caso-alex.test.ts`, se trabaja con el rango sostenible (70–80 % del
 * flujo libre) y se prueba su extremo superior contra el objetivo.
 */
import {
  aEurosActuales,
  ajustarCarteraPorPlazo,
  aniosHastaMeta,
  aportacionPropuesta,
  convertirMetaRenta,
  flujoLibre,
  monteCarlo,
  rentabilidadCartera,
  vfDeterminista,
  volatilidadCartera,
} from '@/lib/motor/calculos';
import { determinarModo, type Ficha } from '@/lib/motor/ficha';
import { redondear } from '@/lib/motor/numerico';
import type { Cartera, HorizonteRetirada, PerfilRiesgo } from '@/lib/motor/supuestos';
import type { PuntoProyeccion, ResultadoAnalisis, SituacionActual } from '@/types/analisis';
import { clasificarMeta } from './clasificar-meta';

// Fase 9 · panel: puntos intermedios del plazo para la visualización de área
// (0 %, 25 %, 50 %, 75 %, 100 %). Misma semilla que el resto del Monte
// Carlo (src/lib/motor/supuestos.ts): reproducible, no una simulación
// aparte.
function calcularProyeccionTemporal(
  patrimonio: number,
  aportacionMes: number,
  pesos: Cartera,
  plazoAnios: number,
): PuntoProyeccion[] {
  const fracciones = [0.25, 0.5, 0.75, 1];
  return [
    { anios: 0, p10: patrimonio, p50: patrimonio, p90: patrimonio },
    ...fracciones.map((f) => {
      const anios = redondear(plazoAnios * f, 1);
      const mc = monteCarlo(patrimonio, aportacionMes, pesos, anios);
      return { anios, p10: mc.p10, p50: mc.p50, p90: mc.p90 };
    }),
  ];
}

// C1: margen para decidir si la aportación actual ya "cuadra" con
// ingresos−gasto (y por tanto el gasto ya incluye las cuotas de deuda).
const TOLERANCIA_CUOTAS_EUR = 20;

function horizonteDesdePlazo(plazoAnios: number): HorizonteRetirada {
  // R6 da tres horizontes de referencia (~40, ~30, ~20 años) sin fronteras
  // exactas entre ellos; se reparten a partes iguales.
  if (plazoAnios >= 35) return '>=40';
  if (plazoAnios >= 25) return '~30';
  return '~20';
}

function calcularSituacion(ficha: Ficha): SituacionActual {
  const ingresos = ficha.ingresosNetosMes.valor;
  const gasto = ficha.gastoTotalMes.valor;
  const aportacionActual = ficha.aportacionMensualActual.valor;
  const colchon = ficha.colchonMeses.valor;
  const deudas = ficha.deudas.valor;

  const cuotasDeudas = deudas?.tipo === 'lista' ? deudas.deudas.reduce((acc, d) => acc + (d.cuota ?? 0), 0) : 0;

  let cuotasIncluidasEnGasto: boolean | null = null;
  let flujoLibreMes: number | null = null;
  if (ingresos !== null && gasto !== null) {
    // C1: si no puede determinarse, se asume que NO las incluye —
    // flujo menor es la lectura prudente (R9).
    cuotasIncluidasEnGasto =
      aportacionActual !== null && ficha.aportacionMensualActual.etiqueta !== 'pendiente'
        ? Math.abs(aportacionActual - (ingresos - gasto)) <= TOLERANCIA_CUOTAS_EUR
        : false;
    flujoLibreMes = flujoLibre(ingresos, gasto, cuotasIncluidasEnGasto, cuotasDeudas);
  }

  // R1: 3–6 meses con ingresos fijos; 6–12 con variables (más prudente).
  const colchonObjetivo: [number, number] | null =
    ficha.ingresosEstabilidad.valor === 'variables'
      ? [6, 12]
      : ficha.ingresosEstabilidad.valor === 'fijos'
        ? [3, 6]
        : null;
  const colchonCompleto = colchon !== null && colchonObjetivo !== null ? colchon >= colchonObjetivo[0] : null;

  const tieneDeudaCara =
    deudas?.tipo === 'lista'
      ? deudas.deudas.some((d) => d.interes !== null && d.interes > 7)
      : deudas?.tipo === 'solo_flag'
        ? deudas.hayInteresAlto
        : deudas?.tipo === 'ninguna'
          ? false
          : null;

  return {
    flujoLibreMes,
    cuotasIncluidasEnGasto,
    colchonMeses: colchon,
    colchonObjetivoMeses: colchonObjetivo,
    colchonCompleto,
    tieneDeudaCara,
  };
}

function resultadoSinPropuesta(
  ficha: Ficha,
  situacion: SituacionActual,
  nota: string | null,
  motivoSuspension: string | null,
): ResultadoAnalisis {
  const { modo, faltantes } = determinarModo(ficha);
  return {
    tipoMeta: clasificarMeta(ficha),
    modo,
    faltantes,
    motivoSuspension,
    situacion,
    objetivoRealEurosHoy: null,
    cartera: null,
    aportacion: null,
    proyeccion: null,
    monteCarlo: null,
    proyeccionTemporal: null,
    nota,
    viable: null,
  };
}

export function ejecutarDiagnostico(ficha: Ficha): ResultadoAnalisis {
  const { modo, faltantes } = determinarModo(ficha);
  const situacion = calcularSituacion(ficha);
  const tipoMeta = clasificarMeta(ficha);

  // R9 · negativa del cliente sobre deudas: diagnóstico descriptivo, nunca
  // una recomendación (aunque el resto de la ficha esté completo).
  if (modo === 'suspendido') {
    return resultadoSinPropuesta(
      ficha,
      situacion,
      null,
      'El cliente prefirió no hablar de sus deudas: sin saber si hay alguna cara, el sistema no puede recomendar invertir con seguridad (R9).',
    );
  }

  // R6 · la renta de un negocio propio no se convierte a patrimonio.
  if (tipoMeta === 'renta_negocio') {
    return resultadoSinPropuesta(
      ficha,
      situacion,
      'Esta meta no se consigue invirtiendo: depende del negocio propio del cliente. La cartera, si la tiene, se valora solo por su papel de colchón o respaldo.',
      null,
    );
  }

  // R8 · flujo libre cero o negativo: el informe cambia de objetivo a
  // estabilización financiera, sin cartera ejecutable.
  if (situacion.flujoLibreMes !== null && situacion.flujoLibreMes <= 0) {
    return resultadoSinPropuesta(
      ficha,
      situacion,
      'El flujo libre es cero o negativo: el diagnóstico se centra en recuperar estabilidad financiera, no en proponer una cartera (R8).',
      null,
    );
  }

  const perfil = ficha.riesgoPerfilDerivado.valor as PerfilRiesgo | null;
  const plazo = ficha.objetivoPlazo.valor;
  const patrimonio = ficha.patrimonioTotal.valor;
  const objetivoCifra = ficha.objetivoCifra.valor;

  let objetivoRealEurosHoy: number | null = null;
  if (objetivoCifra !== null) {
    objetivoRealEurosHoy =
      tipoMeta === 'renta_cartera' && plazo !== null
        ? convertirMetaRenta(objetivoCifra, horizonteDesdePlazo(plazo))
        : objetivoCifra;
  }

  const flujoLibreMes = situacion.flujoLibreMes;
  if (perfil === null || plazo === null || patrimonio === null || flujoLibreMes === null) {
    return resultadoSinPropuesta(ficha, situacion, null, null);
  }

  const pesos = ajustarCarteraPorPlazo(perfil, plazo);
  const rentabilidadNeta = rentabilidadCartera(pesos);
  const volatilidad = volatilidadCartera(pesos);

  // R1: el 100 % del flujo solo si el colchón está completo Y hay
  // provisiones para gastos irregulares. Ese segundo dato no lo recoge la
  // entrevista — se asume prudentemente que no está cubierto, así que el
  // tope de este diagnóstico nunca pasa del 80 %.
  const ap = aportacionPropuesta(null, flujoLibreMes, situacion.colchonCompleto ?? false, false);
  const aportacionPropuestaEur = ap.rangoSostenible[1];
  const aportacionActual = ficha.aportacionMensualActual.valor ?? 0;

  const cartera = {
    perfil,
    pesos,
    rentabilidadNetaAnual: rentabilidadNeta,
    volatilidadAnual: volatilidad,
  };

  const aportacion = {
    actual: ficha.aportacionMensualActual.valor,
    rangoSostenible: ap.rangoSostenible,
    propuesta: aportacionPropuestaEur,
  };

  const proyeccionTemporal = calcularProyeccionTemporal(patrimonio, aportacionPropuestaEur, pesos, plazo);

  let proyeccion = null;
  let monteCarloResultado = null;
  // R4 · se dispara si, al ritmo propuesto, no se llega a la meta dentro del
  // plazo pedido. null si no hay meta convertible que evaluar.
  let viable: boolean | null = null;

  if (objetivoRealEurosHoy !== null) {
    const ritmoActualEurosHoy = aEurosActuales(vfDeterminista(patrimonio, aportacionActual, rentabilidadNeta, plazo), plazo);
    const ritmoPropuestoEurosHoy = aEurosActuales(
      vfDeterminista(patrimonio, aportacionPropuestaEur, rentabilidadNeta, plazo),
      plazo,
    );

    proyeccion = {
      ritmoActualEurosHoy,
      ritmoPropuestoEurosHoy,
      aniosHastaMetaRitmoActual: aniosHastaMeta(patrimonio, aportacionActual, rentabilidadNeta, objetivoRealEurosHoy),
      aniosHastaMetaRitmoPropuesto: aniosHastaMeta(patrimonio, aportacionPropuestaEur, rentabilidadNeta, objetivoRealEurosHoy),
      gapEurosHoy: objetivoRealEurosHoy - ritmoActualEurosHoy,
    };

    const mc = monteCarlo(patrimonio, aportacionPropuestaEur, pesos, plazo, objetivoRealEurosHoy);
    monteCarloResultado = {
      p10: mc.p10,
      p50: mc.p50,
      p90: mc.p90,
      probabilidadCumplimiento: mc.probCumplimiento as number,
      banda: mc.banda!,
    };

    viable = proyeccion.aniosHastaMetaRitmoPropuesto !== null && proyeccion.aniosHastaMetaRitmoPropuesto <= plazo;
  }

  return {
    tipoMeta,
    modo,
    faltantes,
    motivoSuspension: null,
    situacion,
    objetivoRealEurosHoy,
    cartera,
    aportacion,
    proyeccion,
    monteCarlo: monteCarloResultado,
    proyeccionTemporal,
    nota:
      tipoMeta === 'mixta' ? 'Meta mixta: la parte de negocio, si la hay, queda pendiente de tratar aparte.' : null,
    viable,
  };
}
