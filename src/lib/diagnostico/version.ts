// Trazabilidad (docs/data-model.md, «Por qué analisis guarda versión de
// motor y de reglas»): sin esto un informe de hace meses es irreproducible.
// Se sube a mano cuando cambie algo en src/lib/motor/ o en
// docs/criterio/reglas-recomendacion.md.
export const VERSION_MOTOR = '1.0.0';

// Fecha de la revisión vigente de docs/criterio/reglas-recomendacion.md
// (cabecera del propio archivo: «A partir de 2026-08-06, todo módulo toma
// sus supuestos de ESTE archivo»).
export const VERSION_REGLAS = '2026-08-06';
