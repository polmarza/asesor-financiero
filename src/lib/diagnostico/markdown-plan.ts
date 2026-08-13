import type { SeccionesPlan } from '@/types/plan';
import { LETRA_PEQUENA } from '@/types/plan';

// El markdown es una VISTA generada desde las secciones, no la fuente de
// verdad (docs/architecture.md, decisión 2) — se guarda junto a `secciones`
// para poder descargarlo tal cual.
export function construirMarkdownPlan(nombreCliente: string, secciones: SeccionesPlan): string {
  const partes = [
    `# El plan de ${nombreCliente}`,
    '## 1. Tu meta',
    secciones.tuMeta,
    '## 2. Tu foto de hoy',
    secciones.tuFotoDeHoy,
    '## 3. ¿Llegas si sigues así?',
    secciones.llegasSiSiguesAsi,
    '## 4. Tu plan, paso a paso',
    secciones.tuPlanPasoAPaso,
  ];

  if (secciones.siLosNumerosNoSalen) {
    partes.push('## 5. Si los números no salen: tus opciones', secciones.siLosNumerosNoSalen);
  }

  partes.push(
    '## 6. De cada 100 futuros posibles…',
    secciones.deCada100Futuros,
    '## 7. Lo que me falta saber',
    secciones.loQueMeFaltaSaber,
    '## 8. La letra pequeña honesta',
    LETRA_PEQUENA,
  );

  return partes.join('\n\n');
}
