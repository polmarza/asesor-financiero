export type EstadoEntrevista = 'en_curso' | 'pendiente_confirmacion' | 'completada' | 'abandonada';

// Subconjunto de la fila de `entrevistas` que usan las rutas de servidor y
// las páginas de la Fase 3. Se amplía cuando la entrevista empiece a hablar
// (Fase 4) y necesite más columnas.
export interface Entrevista {
  id: string;
  cliente_id: string | null;
  estado: EstadoEntrevista;
  token: string;
  consentimiento_en: string;
  expira_en: string;
}
