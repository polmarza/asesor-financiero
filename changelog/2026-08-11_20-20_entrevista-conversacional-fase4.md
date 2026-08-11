# La entrevista que habla — Fase 4

**Fecha:** 2026-08-11 20:20
**Tipo:** Feature

## Qué se hizo

Chat funcional contra la API de Anthropic, siguiendo
`docs/criterio/plantilla-entrevista.md` con la apertura y las menciones a
«Marta»/«la reunión» sustituidas según
`docs/criterio/instrucciones-agente-v2.md` (el cliente recibe su plan
directamente). Todavía **sin** capturar los datos financieros de forma
estructurada — eso es la Fase 5.

- `src/lib/claude/prompt-entrevista.ts` — prompt de sistema con los 8 bloques
  de la plantilla y las reglas transversales (un rebote por variable, sin
  juicios, ~12 intercambios), más el paso 0 de nombre y correo. También
  exporta `MENSAJE_APERTURA`, el guion literal de apertura.
- `src/lib/claude/herramientas.ts` — herramienta `guardar_cliente` (nombre +
  email), distinta de la futura `guardar_dato` de la Fase 5: esta no toca la
  ficha financiera, solo identifica al cliente.
- `src/lib/clientes.ts` — `guardarClienteDeEntrevista()`: crea el cliente o lo
  enlaza si el correo ya existía, y actualiza `entrevistas.cliente_id`.
- `src/app/api/entrevistas/[token]/mensajes/route.ts` — ruta de servidor que
  guarda el mensaje del cliente, llama a Claude con el historial completo y
  la herramienta, resuelve el `tool_use` si aparece (segunda llamada con el
  `tool_result`) y guarda la respuesta final. Tope técnico de 40 mensajes por
  entrevista como red de seguridad, aparte del cierre natural que ya maneja
  el prompt a los ~12 intercambios.
- `src/app/entrevista/[token]/chat.tsx` — interfaz de chat (burbujas,
  indicador de «Escribiendo…», campo de texto siempre visible).
- `src/app/entrevista/[token]/page.tsx` — ahora carga el historial de
  `mensajes` desde Supabase y monta el chat.
- `src/app/api/entrevistas/route.ts` — al crear la entrevista, guarda también
  el mensaje de apertura (guion literal, sin gastar una llamada al modelo).

## Verificación

Con `pnpm dev` y una `ANTHROPIC_API_KEY` real: conversación completa desde
"¿Cómo te llamas?" hasta la pregunta del objetivo (bloque 1), con la
herramienta `guardar_cliente` invocada correctamente entre medias. Confirmado
en Supabase: fila en `clientes` con nombre y correo, `entrevistas.cliente_id`
enlazado, y los 5 mensajes del turno guardados en orden. Recargar la URL de
la entrevista mantiene la conversación completa. Datos de prueba borrados
después. `pnpm test` sigue en 95/95 y `pnpm build` compila sin avisos.

## Qué se modificó

- `src/lib/claude/prompt-entrevista.ts`, `src/lib/claude/herramientas.ts` (nuevos)
- `src/lib/clientes.ts` (nuevo)
- `src/app/api/entrevistas/[token]/mensajes/route.ts` (nuevo)
- `src/app/entrevista/[token]/chat.tsx` (nuevo)
- `src/app/entrevista/[token]/page.tsx`, `src/app/api/entrevistas/route.ts` (modificados)
- `src/types/mensaje.ts` (nuevo)
- `package.json` — nueva dependencia `@anthropic-ai/sdk`
- `docs/roadmap.md` — Fase 4 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 4: se puede mantener la conversación
entera, las preguntas van en orden y de una en una, los mensajes persisten al
recargar, y aparece una fila en `clientes` con el nombre y el correo dados
durante el chat.
