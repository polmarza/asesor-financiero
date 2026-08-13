// Las 8 secciones fijas de docs/criterio/instrucciones-agente-v2.md §Fase 4.
// `siLosNumerosNoSalen` va en null cuando la meta es viable (R4 no aplica).
// `letraPequena` no la escribe el modelo: es texto fijo (ver
// src/lib/claude/prompt-plan.ts) para garantizar que sale palabra por palabra.
export interface SeccionesPlan {
  tuMeta: string;
  tuFotoDeHoy: string;
  llegasSiSiguesAsi: string;
  tuPlanPasoAPaso: string;
  siLosNumerosNoSalen: string | null;
  deCada100Futuros: string;
  loQueMeFaltaSaber: string;
}

export const LETRA_PEQUENA =
  'Esto es orientación educativa hecha con tus números y supuestos prudentes, no asesoramiento financiero regulado ni una promesa de rentabilidad. Para ejecutar (elegir productos concretos, temas fiscales), contrasta con un asesor autorizado.';
