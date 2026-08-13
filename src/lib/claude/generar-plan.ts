import Anthropic from '@anthropic-ai/sdk';
import { construirPromptPlan } from './prompt-plan';
import { HERRAMIENTA_GUARDAR_PLAN } from './herramientas';
import type { HechosPlan } from '@/lib/diagnostico/hechos-plan';
import type { SeccionesPlan } from '@/types/plan';

export async function generarPlan(hechos: HechosPlan): Promise<SeccionesPlan> {
  const anthropic = new Anthropic();

  const respuesta = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    system: construirPromptPlan(JSON.stringify(hechos)),
    tools: [HERRAMIENTA_GUARDAR_PLAN],
    tool_choice: { type: 'tool', name: 'guardar_plan' },
    messages: [{ role: 'user', content: 'Redacta el plan a partir de los hechos del prompt de sistema.' }],
  });

  const bloque = respuesta.content.find((b) => b.type === 'tool_use');
  if (!bloque || bloque.type !== 'tool_use') {
    throw new Error('El modelo no devolvió el plan con la herramienta esperada.');
  }

  return bloque.input as SeccionesPlan;
}
