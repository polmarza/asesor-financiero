# Confirmación y cierre — Fase 6

**Fecha:** 2026-08-13 18:00
**Tipo:** Feature

## Qué se hizo

Pantalla de resumen editable al terminar la entrevista, la última red contra
datos mal capturados (docs/architecture.md, decisión 4).

- `src/lib/formato-ficha.ts` — traduce cada clave de la ficha a lenguaje
  llano (`ETIQUETA_CAMPO`), formatea su valor (euros con `useGrouping:
  'always'` para que `es-ES` agrupe también los miles de 4 cifras —
  la misma trampa que ya documentaba `docs/testing.md` para el motor),
  y valida el tipo de cada campo antes de guardarlo.
- `src/app/api/entrevistas/[token]/ficha/route.ts` — `PATCH` que corrige un
  dato. Reutiliza `guardarDatoEnFicha()` de la Fase 5 forzando la etiqueta a
  `confirmado`: toda corrección manual se da por buena, sin excepción.
- `src/app/api/entrevistas/[token]/confirmar/route.ts` — cierra la
  entrevista (`estado: 'completada'`, `completada_en`).
- `src/app/entrevista/[token]/confirmacion/` (`page.tsx` + `resumen.tsx`) —
  cada dato en su fila, en lenguaje llano, con su etiqueta de calidad visible
  (`confirmado`/`estimado`/`pendiente`, esta última invita a rellenarlo ahí
  mismo). Clic para editar: número, texto o desplegable según el tipo de
  campo. `deudas` se muestra pero no se edita aquí — su forma es un objeto
  estructurado, no una frase, y forzarla a un campo de texto perdería esa
  estructura; se corrige retomando la conversación. El descargo de
  orientación educativa (texto literal de
  `docs/criterio/instrucciones-agente-v2.md` §8) va visible antes del botón
  de confirmar, no escondido en un acordeón.
- `src/app/entrevista/[token]/chat.tsx` — botón "Ya tengo todo — revisar y
  confirmar mis datos" que aparece en cuanto los 8 bloques están completos.

## Verificación

Con una ficha de prueba sembrada directamente en Supabase (13 de 14 claves
capturadas, `colchonMeses` a propósito sin capturar): la pantalla mostró el
aviso de 1 dato pendiente, corregí `gastoTotalMes` de `estimado` (2.000) a
`confirmado` (2.150), rellené `colchonMeses` (pendiente → confirmado con 5),
y al pulsar «Confirmar y continuar» la entrevista pasó a `completada` en la
base de datos con `completada_en`. Los dos cambios quedaron persistidos con
la etiqueta correcta. Se encontró y corrigió sobre la marcha un aviso de
«dato pendiente» que no se recalculaba tras editar (se calculaba solo en el
servidor al cargar la página). `pnpm test` sigue en 95/95 y `pnpm build`
compila sin avisos. Datos de prueba borrados tras verificar.

## Qué se modificó

- `src/lib/formato-ficha.ts` (nuevo)
- `src/app/api/entrevistas/[token]/ficha/route.ts` (nuevo)
- `src/app/api/entrevistas/[token]/confirmar/route.ts` (nuevo)
- `src/app/entrevista/[token]/confirmacion/page.tsx`, `resumen.tsx` (nuevos)
- `src/app/entrevista/[token]/chat.tsx` (modificado: enlace a confirmación)
- `docs/roadmap.md` — Fase 6 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 6: se llega al final, se corrige un
dato, y en la base de datos aparece cambiado y como `confirmado`. El
descargo visible y sin esconder es requisito no negociable de
`docs/business.md`.
