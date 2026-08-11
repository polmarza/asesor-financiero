# Base de datos Supabase — Fase 2 del roadmap

**Fecha:** 2026-08-11 19:55
**Tipo:** Configuración

## Qué se hizo

Se creó el proyecto de Supabase (región europea) y se aplicó a mano, desde el
SQL Editor de supabase.com, el esquema de `supabase/migrations/0001_esquema_inicial.sql`:
las 8 tablas (`asesores`, `clientes`, `entrevistas`, `mensajes`, `fichas`,
`analisis`, `planes`, `limites_uso`) con RLS activado en todas y sin políticas
para el rol `anon`.

Se instalaron `@supabase/supabase-js` y `@supabase/ssr`, y se añadieron los dos
clientes que pide `docs/architecture.md`:

- `src/lib/supabase/client.ts` — cliente de navegador con la clave pública,
  para el login de la asesora vía Supabase Auth.
- `src/lib/supabase/server.ts` — cliente de servidor con la clave de servicio,
  para las rutas que escriben la entrevista del cliente. Salta RLS por diseño.

Se creó `.env.local` con las credenciales del proyecto. La clave de servicio la
rellenó el usuario directamente en el editor, sin pasar por el chat.

Se verificó la conexión con un script puntual (`@supabase/supabase-js` +
service role key) que consultó las 8 tablas: todas responden y están vacías,
como se espera antes de la primera entrevista. El script se borró tras
comprobarlo — no forma parte del repositorio.

## Qué se modificó

- `.env.local` (nuevo, no versionado)
- `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` (nuevos)
- `package.json` / `pnpm-lock.yaml` — nuevas dependencias
- `docs/roadmap.md` — Fase 2 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 2: las tablas visibles en Supabase con
RLS activado y la aplicación conectando sin errores. El esquema se aplicó a
mano y no por MCP, siguiendo la trampa documentada en `docs/architecture.md`
(«El esquema de Supabase se aplica a mano, no por MCP»).
