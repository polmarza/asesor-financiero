# Esqueleto de Next.js — Fase 1 del roadmap

**Fecha:** 2026-08-11 19:40
**Tipo:** Feature

## Qué se hizo

Se montó el andamiaje de la aplicación alrededor del motor de cálculo ya
existente: Next.js 16 (App Router) + TypeScript + Tailwind CSS, gestionado con
pnpm, y Vitest configurado para correr los 95 tests del motor.

Siguiendo la trampa documentada en `docs/architecture.md` («`create-next-app`
no instala en carpeta no vacía»), el andamiaje se generó en una carpeta
temporal y se copiaron a este repositorio solo los archivos de configuración
(`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`,
`next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `public/` y
`src/app/`), sin tocar `src/lib/motor/`, `motor-python/`, `supabase/` ni
`docs/`.

`pnpm-workspace.yaml` llegó con `allowBuilds` ya generado por `create-next-app`
(`unrs-resolver: false`, `sharp: false`) y la instalación no dio
`ERR_PNPM_IGNORED_BUILDS`: el lint, el build y el dev funcionan igual sin
aprobar ese build nativo, así que no hizo falta tocarlo.

Se añadió `vitest.config.mts` tal como especifica `docs/testing.md`, y los
scripts `test` (`vitest run`) y `baseline` (`python3 motor-python/baseline.py`)
a `package.json`. También `.claude/launch.json` para poder previsualizar
`pnpm dev` desde el navegador integrado.

La página de inicio (`src/app/page.tsx`) se dejó como placeholder mínimo — la
landing real es la Fase 3 del roadmap, con su pantalla de consentimiento.

## Qué se modificó

- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` (nuevos)
- `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `eslint.config.mjs`, `postcss.config.mjs` (nuevos)
- `vitest.config.mts` (nuevo)
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/favicon.ico` (nuevos)
- `public/` (nuevo)
- `.claude/launch.json` (nuevo)
- `docs/roadmap.md` — Fase 1 marcada como hecha

## Por qué

Es la primera fase del roadmap: sin el esqueleto no hay dónde enganchar el
resto (base de datos, entrevista, panel). El criterio de aceptación —`pnpm dev`
abre la app y `pnpm test` da 95 tests en verde— se verificó tras el montaje:
build limpio, 95/95 tests en verde y la app respondiendo en `localhost:3000`
sin errores de consola.
