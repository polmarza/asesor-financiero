import type { Ficha } from '@/lib/motor/ficha';

// Las claves de la ficha que llena la entrevista (bloques 1-8). Se excluyen
// `nombre` y `fechaEntrevista` (los pone `clientes`/`entrevistas`, no el
// chat) y `pendientes` (se deriva, no se captura). Lista explícita porque
// hace falta en tiempo de ejecución (enum de la herramienta, iteración por
// bloques) y TypeScript no puede convertir `keyof Ficha` en un array.
export const CLAVES_FICHA = [
  'objetivoDescripcion',
  'objetivoCifra',
  'objetivoPlazo',
  'ingresosNetosMes',
  'ingresosEstabilidad',
  'gastoTotalMes',
  'aportacionMensualActual',
  'patrimonioTotal',
  'patrimonioDistribucion',
  'deudas',
  'colchonMeses',
  'riesgoExperiencia',
  'riesgoEscenario',
  'riesgoPerfilDerivado',
] as const satisfies ReadonlyArray<Exclude<keyof Ficha, 'nombre' | 'fechaEntrevista' | 'pendientes'>>;

export type ClaveFicha = (typeof CLAVES_FICHA)[number];

// Lo que se guarda en `fichas.datos`: un subconjunto de la Ficha del motor,
// construido dato a dato durante la conversación. Se completa (con
// `pendiente` donde falte) recién en la Fase 7, al ejecutar el motor.
export type DatosFicha = Partial<Pick<Ficha, ClaveFicha>>;

export interface Bloque {
  numero: number;
  titulo: string;
  claves: ClaveFicha[];
}

// Para la barra de progreso (docs/design-system.md) y para saber, turno a
// turno, qué bloques ya tienen algo capturado.
export const BLOQUES: Bloque[] = [
  { numero: 1, titulo: 'El objetivo', claves: ['objetivoDescripcion', 'objetivoCifra', 'objetivoPlazo'] },
  { numero: 2, titulo: 'Situación de partida', claves: ['ingresosNetosMes', 'ingresosEstabilidad'] },
  { numero: 3, titulo: 'El gasto', claves: ['gastoTotalMes'] },
  { numero: 4, titulo: 'Lo que ya ahorra', claves: ['aportacionMensualActual'] },
  { numero: 5, titulo: 'Patrimonio invertible', claves: ['patrimonioTotal', 'patrimonioDistribucion'] },
  { numero: 6, titulo: 'Deudas', claves: ['deudas'] },
  { numero: 7, titulo: 'El colchón', claves: ['colchonMeses'] },
  { numero: 8, titulo: 'Riesgo', claves: ['riesgoExperiencia', 'riesgoEscenario', 'riesgoPerfilDerivado'] },
];

export interface ProgresoBloque {
  numero: number;
  titulo: string;
  completo: boolean;
}

export function calcularProgreso(datos: DatosFicha | null): ProgresoBloque[] {
  return BLOQUES.map((bloque) => ({
    numero: bloque.numero,
    titulo: bloque.titulo,
    completo: bloque.claves.every((clave) => datos?.[clave] !== undefined),
  }));
}
