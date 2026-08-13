# Diagnóstico — Fase 7

**Fecha:** 2026-08-13 18:15
**Tipo:** Feature

## Qué se hizo

Se conecta el motor de cálculo, ya verificado, al resto de la aplicación.
`src/lib/motor/` no se ha tocado: toda la orquestación vive en
`src/lib/diagnostico/`, una capa nueva que decide QUÉ funciones puras del
motor llamar y con qué datos, según el modo del informe y el tipo de meta.

- `src/lib/diagnostico/construir-ficha.ts` — convierte el `datos` parcial de
  `fichas` (jsonb) en la `Ficha` completa que exige el motor, rellenando lo
  no capturado como `pendiente` (nunca un valor inventado).
- `src/lib/diagnostico/clasificar-meta.ts` — clasifica la meta (patrimonio /
  renta de cartera / renta de negocio / mixta, §3 de
  `instrucciones-motor.md`) con una heurística de palabras clave sobre
  `objetivoDescripcion`. Esto no es un cálculo financiero, así que vive en la
  capa de aplicación, no en el motor.
- `src/lib/diagnostico/ejecutar.ts` — el pipeline: reutiliza
  `determinarModo()` del motor (ya existía, Fase 5 no lo tocó) para decidir
  completo/condicionado/suspendido; calcula flujo libre (con la regla C1 de
  cuotas de deuda) y si el colchón cubre el objetivo de R1; si el modo lo
  permite, ajusta la cartera por plazo, deriva rentabilidad y volatilidad,
  propone una aportación (rango sostenible 70–80 %, igual que hace
  `caso-alex.test.ts` — el motor original tampoco resuelve una «aportación
  requerida»), proyecta a ritmo actual y propuesto, y corre el Monte Carlo
  para la probabilidad y la banda. R6 (renta de negocio no se convierte) y
  R8 (flujo libre ≤ 0, sin cartera) cortan el pipeline antes de proponer
  nada.
- `src/lib/diagnostico/version.ts` — `VERSION_MOTOR` y `VERSION_REGLAS`, para
  la trazabilidad que pide `docs/data-model.md`.
- `src/types/analisis.ts` — la forma de `analisis.resultado`.
- `src/app/api/entrevistas/[token]/confirmar/route.ts` — al cerrar la
  entrevista (Fase 6), ahora también construye la ficha completa, ejecuta el
  diagnóstico y lo guarda en `analisis` con `ficha_id`, `modo`,
  `version_motor` y `version_reglas`.

## Verificación

Con dos fichas de prueba sembradas directamente en Supabase y llamando a la
ruta `confirmar`:

- **Ficha completa** (como la de Laura, guion A): `modo: "completo"`,
  cartera moderada ajustada a 20 años, y Monte Carlo con
  `probabilidadCumplimiento` y `banda` — el criterio real de esta fase.
- **Misma ficha con `deudas` en `pendiente`/`negativa_cliente`**:
  `modo: "suspendido"`, `cartera: null`, `aportacion: null`,
  `monteCarlo: null`, con `motivoSuspension` explicando por qué — sin
  recomendación, tal como exige R9.

**Limitación encontrada y documentada, no corregida en esta fase:** el caso
C1 (¿el gasto ya incluye las cuotas de deuda?) se resuelve comparando
`aportacionMensualActual` con `ingresos − gasto`; si no coinciden —algo
habitual, ya que lo que alguien aparta cada mes no tiene por qué casar con lo
que le sobra— se asume prudentemente que NO las incluye y se restan aparte.
En la ficha de prueba esto restó dos veces la cuota de la hipoteca que la
clienta ya había dicho que estaba metida en su gasto. Es el comportamiento
que documenta el propio criterio (`instrucciones-motor.md`, C1) cuando el
dato "no puede determinarse", y la plantilla de entrevista no captura ese
dato de forma explícita. Registrado como
[MEJORA-04](mejoras/backlog.md) en vez de improvisar una solución fuera de
alcance.

`pnpm test` sigue en 95/95 y `pnpm build` compila sin avisos. Datos de
prueba borrados de Supabase tras verificar.

## Qué se modificó

- `src/lib/diagnostico/` (nuevo: `construir-ficha.ts`, `clasificar-meta.ts`, `ejecutar.ts`, `version.ts`)
- `src/types/analisis.ts` (nuevo)
- `src/app/api/entrevistas/[token]/confirmar/route.ts` (ampliado)
- `mejoras/backlog.md` — MEJORA-04
- `docs/roadmap.md` — Fase 7 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 7: una ficha completa produce un
análisis con probabilidad y banda, y una ficha con negativa sobre deudas
queda en modo suspendido sin recomendación.
