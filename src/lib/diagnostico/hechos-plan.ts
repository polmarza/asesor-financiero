import type { ResultadoAnalisis } from '@/types/analisis';
import type { DatosFicha } from '@/types/ficha';
import { ETIQUETA_CAMPO, formatearValor } from '@/lib/formato-ficha';
import { CLAVES_FICHA } from '@/types/ficha';

const eur = (n: number | null | undefined): number | null => (n === null || n === undefined ? null : Math.round(n));
const pct1 = (n: number | null | undefined): number | null =>
  n === null || n === undefined ? null : Math.round(n * 1000) / 10;

// Todo lo que el modelo redactor puede citar en el plan (Fase 8). Cifras ya
// redondeadas (euros/mes §5 de instrucciones-motor.md: "euros enteros;
// porcentajes con 1 decimal") — el modelo copia, no calcula ni redondea.
export function construirHechosPlan(nombreCliente: string, datos: DatosFicha, resultado: ResultadoAnalisis) {
  const s = resultado.situacion;

  return {
    nombreCliente,
    tipoMeta: resultado.tipoMeta,
    modo: resultado.modo,
    motivoSuspension: resultado.motivoSuspension,
    nota: resultado.nota,
    viable: resultado.viable,

    objetivo: {
      descripcion: datos.objetivoDescripcion?.valor ?? null,
      cifraEur: eur(datos.objetivoCifra?.valor ?? null),
      plazoAnios: datos.objetivoPlazo?.valor ?? null,
      objetivoRealEurosHoy: eur(resultado.objetivoRealEurosHoy),
    },

    situacionHoy: {
      ingresosMes: eur(datos.ingresosNetosMes?.valor ?? null),
      gastoMes: eur(datos.gastoTotalMes?.valor ?? null),
      flujoLibreMes: eur(s.flujoLibreMes),
      patrimonioTotal: eur(datos.patrimonioTotal?.valor ?? null),
      patrimonioDistribucion: datos.patrimonioDistribucion?.valor ?? null,
      deudasResumen: formatearValor('deudas', datos.deudas),
      tieneDeudaCara: s.tieneDeudaCara,
      colchonMeses: s.colchonMeses,
      colchonObjetivoMeses: s.colchonObjetivoMeses,
      colchonCompleto: s.colchonCompleto,
    },

    cartera: resultado.cartera
      ? {
          perfil: resultado.cartera.perfil,
          deCada100: Object.fromEntries(
            Object.entries(resultado.cartera.pesos).map(([clase, peso]) => [clase, Math.round((peso ?? 0) * 100)]),
          ),
          rentabilidadNetaAnualPct: pct1(resultado.cartera.rentabilidadNetaAnual * 100),
        }
      : null,

    aportacion: resultado.aportacion
      ? {
          actual: eur(resultado.aportacion.actual),
          propuesta: eur(resultado.aportacion.propuesta),
          porcentajeDelFlujoLibre:
            s.flujoLibreMes && s.flujoLibreMes > 0
              ? pct1((resultado.aportacion.propuesta / s.flujoLibreMes) * 100)
              : null,
        }
      : null,

    proyeccion: resultado.proyeccion
      ? {
          ritmoActualEurosHoy: eur(resultado.proyeccion.ritmoActualEurosHoy),
          ritmoPropuestoEurosHoy: eur(resultado.proyeccion.ritmoPropuestoEurosHoy),
          gapEurosHoy: eur(resultado.proyeccion.gapEurosHoy),
          aniosHastaMetaRitmoActual: resultado.proyeccion.aniosHastaMetaRitmoActual,
          aniosHastaMetaRitmoPropuesto: resultado.proyeccion.aniosHastaMetaRitmoPropuesto,
        }
      : null,

    monteCarlo: resultado.monteCarlo
      ? {
          // Entero, no a 1 decimal: la sección 6 habla en "de cada 100
          // futuros posibles" (docs/criterio/instrucciones-agente-v2.md),
          // así que se redondea aquí y no en la redacción del modelo.
          probabilidadDeCada100: Math.round(resultado.monteCarlo.probabilidadCumplimiento * 100),
          banda: resultado.monteCarlo.banda,
          p10: eur(resultado.monteCarlo.p10),
          p50: eur(resultado.monteCarlo.p50),
          p90: eur(resultado.monteCarlo.p90),
        }
      : null,

    pendientes: resultado.faltantes.map((clave) => ETIQUETA_CAMPO[clave as keyof typeof ETIQUETA_CAMPO] ?? clave),
    estimados: CLAVES_FICHA.filter((c) => datos[c]?.etiqueta === 'estimado').map((c) => ETIQUETA_CAMPO[c]),
  };
}

export type HechosPlan = ReturnType<typeof construirHechosPlan>;
