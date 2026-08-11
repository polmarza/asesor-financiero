# Landing, consentimiento y creación de la entrevista — Fase 3

**Fecha:** 2026-08-11 20:05
**Tipo:** Feature

## Qué se hizo

Implementado el flujo de entrada pública descrito en `docs/user-flows.md`
(Flujo 1, pasos 1-2):

- `src/app/page.tsx` — landing pública con el «qué es, para quién» y un botón
  que lleva a `/consentimiento`.
- `src/app/consentimiento/page.tsx` — pantalla de consentimiento con las
  **dos finalidades** declaradas por separado (diagnóstico y contacto
  comercial del asesor), el descargo de orientación educativa visible antes de
  empezar, y una casilla de aceptación explícita que habilita el botón
  «Acepto y empiezo». No hay forma de llegar a `/entrevista/[token]` sin pasar
  por aquí: el token solo lo emite la ruta de servidor de abajo.
- `src/app/api/entrevistas/route.ts` — ruta POST que, al aceptar, hashea la IP
  (`src/lib/ip-hash.ts`, SHA-256, nunca la IP en claro), comprueba el límite de
  entrevistas nuevas por IP en la última hora contra `limites_uso`, y si no lo
  supera crea la fila en `entrevistas` (con `cliente_id` en `NULL`, todavía
  anónima) y registra el uso.
- `src/app/entrevista/[token]/page.tsx` — Server Component que resuelve el
  token contra la base de datos: si no existe o ha caducado, ofrece empezar de
  nuevo; si es válido, confirma la fecha de consentimiento. El chat de verdad
  (Fase 4) se conecta aquí mismo.

**Umbral del límite de abuso:** 5 entrevistas nuevas por IP y hora
(`LIMITE_ENTREVISTAS_POR_HORA` en `route.ts`). No viene de ningún documento —
es una decisión técnica de partida, pendiente de ajustar con datos reales de
uso una vez la aplicación esté publicada.

## Verificación

Con `pnpm dev`: landing → consentimiento → aceptar → `/entrevista/[token]`
mostrando la fecha de consentimiento; recargar esa URL mantiene la misma
entrevista; un token inventado muestra «enlace no válido»; la fila apareció en
`entrevistas` con `cliente_id: null` y en `limites_uso` con el hash de IP. Los
datos de prueba se borraron después de verificar. `pnpm test` sigue en 95/95 y
`pnpm build` compila sin avisos.

## Qué se modificó

- `src/app/page.tsx` (reescrito)
- `src/app/consentimiento/page.tsx` (nuevo)
- `src/app/api/entrevistas/route.ts` (nuevo)
- `src/app/entrevista/[token]/page.tsx` (nuevo)
- `src/lib/ip-hash.ts` (nuevo)
- `src/types/entrevista.ts` (nuevo)
- `docs/roadmap.md` — Fase 3 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 3: desde la landing se llega a una
entrevista con su URL propia, la fila queda en `entrevistas` con su fecha de
consentimiento, recargar mantiene la misma entrevista, y sin aceptar no hay
forma de llegar al chat.
