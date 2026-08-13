import type { BandaProbabilidad, Cartera, PerfilRiesgo } from '@/lib/motor/supuestos';
import type { ModoInforme, TipoMeta } from '@/lib/motor/ficha';

export interface SituacionActual {
  flujoLibreMes: number | null;
  cuotasIncluidasEnGasto: boolean | null;
  colchonMeses: number | null;
  colchonObjetivoMeses: [number, number] | null;
  colchonCompleto: boolean | null;
  tieneDeudaCara: boolean | null;
}

export interface CarteraObjetivo {
  perfil: PerfilRiesgo;
  pesos: Cartera;
  rentabilidadNetaAnual: number;
  volatilidadAnual: number;
}

export interface Aportacion {
  actual: number | null;
  rangoSostenible: [number, number];
  propuesta: number;
}

export interface Proyeccion {
  ritmoActualEurosHoy: number | null;
  ritmoPropuestoEurosHoy: number;
  aniosHastaMetaRitmoActual: number | null;
  aniosHastaMetaRitmoPropuesto: number | null;
  gapEurosHoy: number | null;
}

export interface ResultadoMonteCarlo {
  p10: number;
  p50: number;
  p90: number;
  probabilidadCumplimiento: number;
  banda: BandaProbabilidad;
}

// Fase 9 · panel: puntos intermedios del Monte Carlo (0, 25, 50, 75, 100 %
// del plazo) para la visualización de área p10/p50/p90 en el tiempo
// (docs/design-system.md). Misma semilla que el resultado final: es
// reproducible, no una segunda simulación independiente.
export interface PuntoProyeccion {
  anios: number;
  p10: number;
  p50: number;
  p90: number;
}

// Forma de `analisis.resultado`. Todo lo que aparece en el plan (Fase 8) tiene
// que poder rastrearse hasta aquí (docs/prd.md, «Trazabilidad»).
export interface ResultadoAnalisis {
  tipoMeta: TipoMeta;
  modo: ModoInforme;
  faltantes: string[];
  motivoSuspension: string | null;
  situacion: SituacionActual;
  objetivoRealEurosHoy: number | null;
  cartera: CarteraObjetivo | null;
  aportacion: Aportacion | null;
  proyeccion: Proyeccion | null;
  monteCarlo: ResultadoMonteCarlo | null;
  proyeccionTemporal: PuntoProyeccion[] | null;
  // Casos que cierran el diagnóstico sin propuesta de cartera: R6 (renta de
  // negocio propio, no se convierte), R8 (flujo libre ≤ 0, modo
  // estabilización) o meta mixta con parte no convertible.
  nota: string | null;
  // R4 · null cuando no hay proyección que evaluar (condicionado, suspendido,
  // renta_negocio, R8). Si no es viable, la Fase 8 añade la sección de
  // palancas («si los números no salen»).
  viable: boolean | null;
}
