import type Anthropic from '@anthropic-ai/sdk';

// Fase 4: única herramienta del modelo. Crea/enlaza el cliente en cuanto la
// entrevista tiene nombre y correo — distinta de `guardar_dato` (Fase 5),
// que rellenará la ficha financiera de los 8 bloques.
export const HERRAMIENTA_GUARDAR_CLIENTE: Anthropic.Tool = {
  name: 'guardar_cliente',
  description:
    'Registra el nombre y el correo del cliente en cuanto tengas ambos datos, antes de continuar con el resto de la entrevista.',
  input_schema: {
    type: 'object',
    properties: {
      nombre: { type: 'string', description: 'Nombre con el que se presenta el cliente.' },
      email: { type: 'string', description: 'Correo electrónico del cliente, tal como lo dio.' },
    },
    required: ['nombre', 'email'],
  },
};
