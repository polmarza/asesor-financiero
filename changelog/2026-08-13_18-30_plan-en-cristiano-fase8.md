# El plan en cristiano — Fase 8

**Fecha:** 2026-08-13 18:30
**Tipo:** Feature

## Qué se hizo

El modelo redacta el plan a partir del JSON que ya calculó el motor
(`analisis.resultado`, Fase 7) — nunca al revés. Sigue las 8 secciones fijas
de `docs/criterio/instrucciones-agente-v2.md` §Fase 4.

- `src/lib/diagnostico/hechos-plan.ts` — construye los "hechos" que se le
  pasan al redactor: todas las cifras ya redondeadas (euros enteros,
  porcentajes a 1 decimal salvo la probabilidad del Monte Carlo, que se
  redondea a un entero de 0-100 porque la sección 6 habla en formato
  "de cada 100 futuros" — ver más abajo por qué).
- `src/lib/claude/prompt-plan.ts` + `HERRAMIENTA_GUARDAR_PLAN` (en
  `herramientas.ts`) — el redactor entrega el plan como llamada a
  herramienta (7 campos de texto), no como texto libre, para que la
  estructura de 8 secciones no se le olvide nunca. Instrucciones explícitas:
  copiar las cifras tal cual, nunca recalcular ni redondear de otra forma,
  nunca nombrar productos, nunca prometer rentabilidad.
- `src/lib/claude/generar-plan.ts` — llama a Claude con `tool_choice`
  forzado a `guardar_plan`.
- `src/lib/diagnostico/markdown-plan.ts` — ensambla las 7 secciones más la
  letra pequeña (sección 8) en un único markdown. La letra pequeña **no la
  escribe el modelo**: es texto fijo de la aplicación
  (`src/types/plan.ts`), para garantizar que sale palabra por palabra.
- `src/app/api/entrevistas/[token]/confirmar/route.ts` — tras guardar el
  análisis (Fase 7), genera el plan y lo guarda en `planes`. Si la
  generación falla, el análisis ya ha quedado guardado y trazable.
- `src/app/plan/[token]/page.tsx` — página del plan: las 8 secciones en
  tarjetas plegables, con la letra pequeña siempre visible al final.
- `src/app/entrevista/[token]/confirmacion/resumen.tsx` — al confirmar,
  navega a `/plan/[token]` en vez de mostrar una pantalla estática; también
  reutiliza `LETRA_PEQUENA` de `src/types/plan.ts` en vez de duplicar el
  texto del descargo.

## Verificación

Con fichas de prueba sembradas en Supabase y `confirmar` real (motor +
modelo):

- **Meta viable** (como Laura, 150.000 € en 20 años): las 8 secciones se
  leen sin saber finanzas, y **toda cifra que aparece está también en
  `analisis`** — comprobado cifra a cifra: 150.000 €, 20 años, 2.800 €,
  2.000 €, 800 €, 22.000 €, 5 meses, 640 € (80 % del flujo), reparto
  50/40/10, p10/p50/p90 y 84 de cada 100 escenarios. Sección 5 ("si los
  números no salen") ausente, como corresponde a `viable: true`.
- **Meta no viable** (1.000.000 € en 5 años con 300 €/mes de ahorro):
  sección 5 aparece con las palancas correctas (más tiempo o meta más
  pequeña, nunca más riesgo), y "0 de cada 100" en la sección 6.

**Un ajuste durante la propia verificación:** la primera pasada mostró "84
de cada 100" en el texto cuando el dato pasado al modelo era 83,6 (a 1
decimal) — el modelo redondeó él mismo al convertirlo a la lectura de "cada
100 futuros" que pide el criterio. Se corrigió pasando ya un entero
(`probabilidadDeCada100`) en los hechos, para que esa cifra la ponga el
código, no el modelo.

`pnpm test` sigue en 95/95 y `pnpm build` compila sin avisos. Datos de
prueba borrados de Supabase tras verificar.

## Qué se modificó

- `src/lib/diagnostico/hechos-plan.ts`, `markdown-plan.ts` (nuevos)
- `src/lib/claude/prompt-plan.ts`, `generar-plan.ts` (nuevos)
- `src/lib/claude/herramientas.ts` — `HERRAMIENTA_GUARDAR_PLAN`
- `src/types/plan.ts` (nuevo)
- `src/types/analisis.ts` — campo `viable`
- `src/lib/diagnostico/ejecutar.ts` — calcula `viable` (R4)
- `src/app/plan/[token]/page.tsx` (nuevo)
- `src/app/api/entrevistas/[token]/confirmar/route.ts` (ampliado)
- `src/app/entrevista/[token]/confirmacion/resumen.tsx` (navega al plan)
- `docs/roadmap.md` — Fase 8 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 8: el plan se lee sin saber
finanzas, y toda cifra que aparece está también en `analisis`.
