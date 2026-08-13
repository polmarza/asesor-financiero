# La entrevista que escucha — Fase 5

**Fecha:** 2026-08-11 20:45
**Tipo:** Feature

## Qué se hizo

La fase decisiva del proyecto: la conversación se convierte en datos
estructurados, turno a turno, con su etiqueta de calidad.

- `src/types/ficha.ts` — `CLAVES_FICHA` (las 14 claves de la ficha, derivadas
  de `src/lib/motor/ficha.ts` sin duplicar valores), `BLOQUES` (para la barra
  de progreso) y `calcularProgreso()`.
- `src/lib/claude/herramientas.ts` — herramienta `guardar_dato`, con las
  claves como enum del JSON Schema tal como pide el roadmap.
- `src/lib/fichas.ts` — `guardarDatoEnFicha()` (upsert en `fichas`, con las
  columnas denormalizadas de objetivo/perfil) y `construirEstadoFicha()`, que
  vuelca lo ya capturado como texto para inyectarlo en el prompt.
- `src/lib/claude/prompt-entrevista.ts` — reglas de etiquetado
  (`confirmado`/`estimado`/`pendiente`), formato exacto del objeto `deudas`,
  formato exacto de valor por clave (para que los campos de opciones fijas
  coincidan con los enums del motor: `ingresosEstabilidad`, `riesgoEscenario`,
  `riesgoPerfilDerivado`), y la derivación de `riesgoPerfilDerivado` a partir
  de lo que el cliente hizo (P10) frente a lo que dice que haría (P11). El
  estado de la ficha se inyecta en el prompt en cada turno
  (`construirPromptSistema`), así el modelo nunca vuelve a preguntar algo ya
  capturado.
- `src/app/api/entrevistas/[token]/mensajes/route.ts` — bucle que procesa
  varias llamadas a herramientas por turno (pueden llegar `guardar_cliente` y
  varios `guardar_dato` en la misma respuesta), y devuelve el progreso
  actualizado de los 8 bloques.
- `src/app/entrevista/[token]/progreso.tsx` — barra de progreso (lateral en
  escritorio, superior en móvil, según `docs/design-system.md`), integrada en
  `chat.tsx` y calculada también en `page.tsx` para la carga inicial.

## Verificación

Conversación completa contra la API real, con el guion de
`material-clase/GUION-CLIENTE-PRUEBA.md`:

- **Guion A** (camino limpio): las 14 claves quedaron en `fichas.datos` con
  la etiqueta y la cita correctas, sin inventar el saldo de la hipoteca
  (caso C8).
- **Variante 1** (respuesta ambigua del gasto → rango → elige uno): salió
  `gastoTotalMes: 2000` con etiqueta **`estimado`** — el criterio real de esta
  fase.
- **Variante 3** (negativa a hablar de deudas, con la insistencia única):
  salió `deudas: {tipo:"pendiente", motivo:"negativa_cliente"}`, etiqueta
  `pendiente` — deja la ficha lista para el modo suspendido de la Fase 7.

**Dos fallos encontrados y corregidos durante la propia verificación** (antes
de repetir la prueba): el modelo capturaba `objetivoCifra` pero se olvidaba
de `objetivoPlazo` aunque llegaran en la misma respuesta, y guardaba
`riesgoEscenario`/`ingresosEstabilidad` como frases en vez de los valores
exactos del enum del motor (`"aguantar"`, `"fijos"`...), y nunca derivaba
`riesgoPerfilDerivado`. Se reforzó el prompt con instrucciones explícitas de
formato por clave y se repitió la prueba completa: los tres problemas
quedaron resueltos.

`pnpm test` sigue en 95/95 y `pnpm build` compila sin avisos. Datos de
prueba borrados de Supabase tras verificar.

## Qué se modificó

- `src/types/ficha.ts` (nuevo)
- `src/lib/fichas.ts` (nuevo)
- `src/app/entrevista/[token]/progreso.tsx` (nuevo)
- `src/lib/claude/herramientas.ts`, `src/lib/claude/prompt-entrevista.ts` (ampliados)
- `src/app/api/entrevistas/[token]/mensajes/route.ts` (reescrito: bucle multi-herramienta)
- `src/app/entrevista/[token]/chat.tsx`, `src/app/entrevista/[token]/page.tsx` (modificados)
- `docs/roadmap.md` — Fase 5 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 5: los datos aparecen en `fichas` con
la etiqueta correcta, y en particular la variante 1 del guion sale
`estimado`, no `confirmado` — la distinción que decide si un informe puede
salir completo, condicionado o suspendido (R9).
