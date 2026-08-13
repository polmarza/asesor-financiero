import type Anthropic from '@anthropic-ai/sdk';
import { CLAVES_FICHA } from '@/types/ficha';

// Fase 4: crea/enlaza el cliente en cuanto la entrevista tiene nombre y
// correo — distinta de `guardar_dato` (Fase 5), que rellena la ficha
// financiera de los 8 bloques.
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

// Fase 5: guarda un dato de la ficha en cuanto quede resuelto (con valor,
// estimado por rango, o pendiente tras el rebote). Las claves son el
// contrato de docs/data-model.md / src/lib/motor/ficha.ts — no se renombran.
export const HERRAMIENTA_GUARDAR_DATO: Anthropic.Tool = {
  name: 'guardar_dato',
  description:
    'Guarda un dato de la ficha financiera en cuanto quede resuelto: con un valor claro, con un valor estimado (rango/aproximación), o como pendiente si tras el rebote sigue sin haber dato. Llámala una vez por cada dato que se resuelva, incluidos los que el cliente suelte fuera de orden.',
  input_schema: {
    type: 'object',
    properties: {
      clave: {
        type: 'string',
        enum: [...CLAVES_FICHA],
        description: 'La clave exacta de la ficha a la que corresponde este dato.',
      },
      valor: {
        description:
          'El valor capturado. Número (sin símbolos ni puntos de miles) para las claves numéricas. Para ingresosEstabilidad: exactamente "fijos" o "variables". Para riesgoEscenario: exactamente "vender", "aguantar" o "comprar". Para riesgoPerfilDerivado: exactamente "conservador", "moderado" o "dinamico". Para `deudas`, un objeto: {tipo:"lista", deudas:[{tipo, saldo, cuota, interes}]} · {tipo:"ninguna"} · {tipo:"solo_flag", hayInteresAlto} · {tipo:"pendiente", motivo:"negativa_cliente"}. Texto libre solo para objetivoDescripcion, patrimonioDistribucion y riesgoExperiencia. Usa null si etiqueta es "pendiente" y no hay valor.',
      },
      etiqueta: {
        type: 'string',
        enum: ['confirmado', 'estimado', 'pendiente'],
        description:
          'confirmado: lo dio con claridad o lo corrigió. estimado: se ofreció un rango o dio una aproximación. pendiente: se preguntó, hubo rebote, y sigue sin haber dato.',
      },
      cita: { type: 'string', description: 'Palabras textuales del cliente que respaldan el valor, si las hay.' },
      supuesto: {
        type: 'string',
        description:
          'Solo si aplicaste un extremo prudente de un rango: qué extremo elegiste y por qué (R9: gastos e inflación al alza; ingresos, colchón y rentabilidad a la baja).',
      },
    },
    required: ['clave', 'valor', 'etiqueta'],
  },
};

// Fase 8: el redactor entrega el plan como llamada a herramienta, no como
// texto libre — fuerza la estructura de 8 secciones y evita que se le olvide
// alguna. `letraPequena` no forma parte del schema: es texto fijo que pone
// la aplicación, nunca el modelo (docs/roadmap.md, Fase 8).
export const HERRAMIENTA_GUARDAR_PLAN: Anthropic.Tool = {
  name: 'guardar_plan',
  description: 'Entrega el plan financiero terminado, sección por sección.',
  input_schema: {
    type: 'object',
    properties: {
      tuMeta: { type: 'string', description: 'Sección 1: la meta del cliente, en sus palabras, con cifra y fecha.' },
      tuFotoDeHoy: { type: 'string', description: 'Sección 2: 4-6 líneas — lo que entra, lo que sale, lo que sobra, lo que tiene y dónde, deudas, colchón.' },
      llegasSiSiguesAsi: { type: 'string', description: 'Sección 3: la respuesta honesta y directa, con el número que la sostiene.' },
      tuPlanPasoAPaso: {
        type: 'string',
        description:
          'Sección 4: checklist accionable en el orden de R1 (colchón, deudas, cuánto invertir con la cifra concreta y de dónde sale, y el reparto "de cada 100€ que inviertas").',
      },
      siLosNumerosNoSalen: {
        type: ['string', 'null'],
        description: 'Sección 5: SOLO si `viable` es false en los hechos. Si es viable, null.',
      },
      deCada100Futuros: { type: 'string', description: 'Sección 6: la probabilidad del Monte Carlo en palabras, con horquilla.' },
      loQueMeFaltaSaber: { type: 'string', description: 'Sección 7: pendientes y estimados, y cómo cambiarían el plan.' },
    },
    required: ['tuMeta', 'tuFotoDeHoy', 'llegasSiSiguesAsi', 'tuPlanPasoAPaso', 'siLosNumerosNoSalen', 'deCada100Futuros', 'loQueMeFaltaSaber'],
  },
};
