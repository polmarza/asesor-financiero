# El panel de Marta — Fase 9

**Fecha:** 2026-08-13 18:50
**Tipo:** Feature

## Qué se hizo

Auth para la asesora y el panel donde ve a sus clientes.

### Login

Email + contraseña, no enlace mágico: Marta ya tenía su cuenta creada en
Supabase Auth con contraseña propia, así que se implementó
`signInWithPassword`. Sin página de registro — es la única asesora — y sin
ningún enlace desde la landing ni el resto de la app: `/panel/login` solo se
llega a ella sabiendo la URL.

- `src/lib/supabase/middleware.ts` + `middleware.ts` (raíz) — refresca la
  cookie de sesión en cada petición a `/panel/**`.
- `src/lib/supabase/sesion.ts` — cliente de Supabase para Server
  Components/Route Handlers con la sesión de Marta (clave pública + su JWT).
  Distinto de `src/lib/supabase/server.ts` (clave de servicio, salta RLS a
  propósito para el chat del cliente): aquí el acceso lo decide la base de
  datos vía `es_asesor()`, no el código.
- `src/app/panel/login/page.tsx` — formulario, fuera del grupo de rutas
  protegidas para no entrar en bucle de redirección.
- `src/app/panel/(protegido)/layout.tsx` — exige sesión Y estar en
  `asesores` (la tabla ya existía desde la Fase 2). Si hay sesión pero no es
  asesor, cierra la sesión y redirige — «estar en la tabla es el permiso».
- `src/app/panel/salir/route.ts` — cierra sesión.

Se dio de alta a Marta en `asesores` con el SQL pegado en el chat, sobre la
fila que ya tenía en `auth.users`.

### Listado y ficha de cliente

- `src/app/panel/(protegido)/page.tsx` + `listado-clientes.tsx` — una fila
  por cliente (a partir de su ficha más reciente), ordenable por banda de
  probabilidad — de más en riesgo a menos, para responder «¿quién necesita
  que le llame?» en menos de 30 segundos.
- `src/app/panel/(protegido)/clientes/[id]/` — las tres vistas de
  `docs/user-flows.md`: **Diagnóstico** (por defecto, las 4 visualizaciones),
  **Ficha cruda** (reutiliza los mismos `BLOQUES`/`formatearValor` de la
  Fase 6, con la cita literal del cliente) y **Plan** (las secciones de la
  Fase 8, tal como las vio el cliente).
- Las 4 visualizaciones (`docs/design-system.md`): probabilidad + banda
  (único sitio con semáforo), composición de cartera (anillo, Recharts),
  proyección p10/p50/p90 en el tiempo (área, Recharts) y prioridades R1
  (checklist derivado de `analisis.resultado`, sin recalcular nada).

### Ampliación del motor de orquestación (Fase 7)

La visualización de proyección necesitaba una trayectoria en el tiempo, y
`analisis.resultado` solo guardaba el percentil final. Se añadió
`proyeccionTemporal` en `src/lib/diagnostico/ejecutar.ts`: 5 puntos (0, 25,
50, 75, 100 % del plazo) con la misma semilla que el resto del Monte Carlo
— reproducible, no una simulación aparte.

## Verificación

Con una asesora de prueba temporal (cuenta y contraseña propias, creada y
borrada con la clave de servicio — nunca se tocó la cuenta real de Marta) y
un cliente de prueba con diagnóstico completo:

- Sin sesión, `/panel` redirige a `/panel/login`.
- Login correcto entra al listado; se ve la fila de la clienta con su banda
  ("Alta").
- Ficha de cliente: las 4 visualizaciones renderizan con datos reales y
  trazables a `analisis`; las tres pestañas muestran contenido correcto.

**Un fallo encontrado y corregido en la propia verificación:** con
`deudas: {tipo:"ninguna"}`, `tieneDeudaCara` quedaba en `null` («sin dato»)
en vez de `false` — el checklist de prioridades R1 mostraba «sin dato» donde
debía mostrar «no tiene». Corregido en `calcularSituacion()`.

`pnpm test` sigue en 95/95 y `pnpm build` compila sin avisos. Datos y cuenta
de prueba borrados tras verificar.

## Qué se modificó

- `src/lib/supabase/middleware.ts`, `src/lib/supabase/sesion.ts` (nuevos)
- `middleware.ts` (nuevo, raíz)
- `src/app/panel/login/page.tsx`, `src/app/panel/salir/route.ts` (nuevos)
- `src/app/panel/(protegido)/` — `layout.tsx`, `page.tsx`,
  `listado-clientes.tsx`, `insignia-banda.tsx`,
  `clientes/[id]/{page,vistas,probabilidad-banda,composicion-cartera,proyeccion-area,prioridades-r1}.tsx`
  (nuevos)
- `src/types/panel.ts` (nuevo)
- `src/types/analisis.ts` — `PuntoProyeccion`, `proyeccionTemporal`
- `src/lib/diagnostico/ejecutar.ts` — calcula `proyeccionTemporal`; corrige
  `tieneDeudaCara` para `deudas: "ninguna"`
- `package.json` — nueva dependencia `recharts`
- `docs/roadmap.md` — Fase 9 marcada como hecha

## Por qué

Es el criterio de aceptación de la Fase 9: Marta entra, ve el listado
ordenado por riesgo y, en menos de 30 segundos, identifica qué cliente tiene
la meta en peligro por su banda y sus visualizaciones.
