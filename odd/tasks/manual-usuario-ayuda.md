# Manual de usuario en la app (`/ayuda`)

## Objetivo

Agregar una sección de ayuda dentro de la aplicación, en `/ayuda`, con el manual de usuario. Los temas se escriben en MDX y se versionan en el repositorio. La sección tiene un índice y un buscador, y cada rol ve solo los temas que le corresponden.

## Problema y por qué

El sistema tiene cuatro roles con capacidades distintas: Admin País, Admin Regional, Admin Escuela y Staff. Hoy no hay ninguna guía dentro de la app. El personal de las escuelas necesita saber cómo consultar, registrar actas y subir escaneos sin depender de capacitaciones presenciales. Esto es alcance nuevo, que todavía no figura en el BRD.

## Alcance

- Página `/ayuda` con el índice de temas visibles para el rol y un buscador por título, descripción y palabras clave.
- Página `/ayuda/[slug]` con el contenido de un tema.
- Contenido MDX en `src/contenido/ayuda/`, fuera del árbol de rutas.
- Enlace "Ayuda" en el `Sidebar`, visible para todos los roles.
- Requerimiento agregado al BRD.

Fuera de alcance: la ayuda contextual por pantalla, los recorridos guiados y la edición del manual desde la app.

## Restricciones

- **El filtro por rol se aplica en el servidor.** Las páginas son server components que llaman a `obtenerSesion()`. Al cliente solo llega el índice de los temas permitidos.
- Si un tema no existe o no está permitido para el rol, la página responde `notFound()` y no revela que el tema existe.
- Todo se escribe en español de Costa Rica: código, contenido y pruebas.
- Los colores usan los tokens de diseño. Se respeta WCAG AA.
- Se mantiene `next.config.test.ts` en verde, incluida la CSP.
- No se hacen commits salvo que el usuario los pida explícitamente (CLAUDE.md del proyecto).

## Decisiones

- **MDX con `@next/mdx`.** Cada tema se importa como módulo y exporta `metadatos` (título, descripción, niveles permitidos, orden y palabras clave). Así no se necesita `fs`, se evita la regla `detect-non-literal-fs-filename` y los metadatos quedan tipados. Hay que verificar con Context7 la configuración para Next 16 y Turbopack en T2.
- **Búsqueda en el cliente** sobre el índice ya filtrado, sin dependencias nuevas.
- **Roles por `nivel`** (1 a 4). Cada tema declara `niveles: NivelRol[]`.

## Modo TDD

- Estado: activado.
- Fuente: CLAUDE.md del proyecto, §1.
- Runner: `pnpm test` (Vitest). El proyecto no usa Playwright: el e2e es Vitest contra SQLite.

## Ruta

Organic Driven Development (ODD), sin SDD, por decisión del usuario del 2026-10-03. Todo va en la rama actual `feat/gestion-usuarios-jerarquia`.

## Tareas

- [x] **T1 — Lógica de temas.**
  - Crear `src/lib/ayuda/` con el tipo `TemaAyuda`.
  - Agregar `temasVisiblesPara(temas, nivel)`, que filtra y ordena.
  - Agregar `buscarTemas(temas, consulta)`, sin distinguir mayúsculas ni tildes.
  - Ruta: inline, porque es un archivo nuevo más sus pruebas.
  - Pruebas unitarias para los niveles 1 a 4 y para la búsqueda.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: `src/lib/ayuda/temas.ts` y `src/lib/ayuda/__tests__/temas.test.ts`. RED: la prueba falló por módulo `../temas` inexistente. GREEN: 12 pruebas pasan (`pnpm vitest run src/lib/ayuda`).
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T2 — Integrar MDX.**
  - Agregar `@next/mdx` y `@mdx-js/react` si hace falta.
  - Configurar `withMDX` en `next.config.ts`.
  - Agregar `mdx-components.tsx` con estilos que usen los tokens.
  - Agregar la declaración de tipos para `.mdx`.
  - Ruta: delegada, porque toca más de 2 archivos de configuración.
  - Chequeos: `next.config.test.ts`, `pnpm typecheck` y `pnpm build`.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: dependencias `@next/mdx@16.2.9` (alineada con Next), `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`. `next.config.ts` envuelto con `createMDX()` sin cambiar `pageExtensions` (el contenido vive fuera de `app/`). Nuevos: `src/mdx-components.tsx` (con tokens) y `src/types/mdx.d.ts` (necesario porque `tsconfig` limita `types`). Configuración verificada con la documentación de Next 16.2.9 vía Context7.
  - Chequeos: `next.config.test.ts` 6/6; `pnpm typecheck` y `pnpm build` sin errores (Turbopack).
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T3 — Registro de contenido.**
  - Crear `src/contenido/ayuda/registro.ts`, que mapea cada slug a su módulo MDX y sus metadatos.
  - Agregar un tema MDX de ejemplo.
  - Agregar una prueba que valide que los slugs son únicos y que todo tema tiene niveles válidos y título.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Desviación del diseño original: en lugar de `registro.ts`, se separan metadatos y contenido porque Vitest no importa `.mdx`: `src/contenido/ayuda/temas.ts` (catálogo), `slugs.ts` (lista tipada de slugs con contenido), `contenido.ts` (`cargarContenidoTema` con `import()` dinámico) y `iniciar-sesion.mdx` (tema de ejemplo, niveles 1–4).
  - Evidencia: RED: módulo `../temas` inexistente. GREEN: 5 pruebas (slugs únicos, niveles válidos, título y descripción, catálogo y cargadores coinciden en ambos sentidos).
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T4 — Página `/ayuda`.**
  - Server component que obtiene la sesión y filtra los temas.
  - Componente cliente `BuscadorAyuda` para el índice y la búsqueda.
  - Manejar el estado vacío.
  - Pruebas del componente y de la página con la sesión mockeada.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: `src/app/ayuda/page.tsx`, `src/components/ayuda/BuscadorAyuda.tsx` y sus pruebas. RED: imports `../BuscadorAyuda` y `../page` no resolvían. GREEN: 5 pruebas del buscador y 3 de la página (redirección sin sesión, nivel 1 ve todo, nivel 4 no ve tema exclusivo del nivel 1).
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T5 — Página `/ayuda/[slug]`.**
  - Server component que verifica el rol y responde `notFound()` si el tema no existe o no está permitido.
  - Pruebas: tema permitido, tema no permitido y slug inexistente.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: `src/app/ayuda/[slug]/page.tsx` y su prueba. RED: `../page` no resolvía. GREEN: 5 pruebas (sin sesión, permitido, no permitido, slug inexistente, sin contenido cargable; los dos últimos casos de 404 no revelan existencia).
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T6 — Enlace en el `Sidebar`.**
  - Agregar el ítem "Ayuda" con un icono de lucide, visible para todos los roles.
  - Prueba del `Sidebar`.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: sección "Soporte" con "Ayuda" (`CircleHelp`) en `Sidebar.tsx`; prueba nueva `src/components/layout/__tests__/Sidebar.test.tsx`. RED: 5 de 5 fallaban sin el enlace. GREEN: 5 pasan (niveles 1–4 ven Ayuda; el nivel 4 no ve Usuarios).
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T7 — Contenido del manual.**
  - Temas por funcionalidad: iniciar sesión, consultar graduados, actas, tomos y escaneos, usuarios, configuración y auditoría.
  - Cada tema con sus niveles.
  - Antes de escribir, verificar el comportamiento real de `/actas/[id]` y la visibilidad de `/auditoria`.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: 8 temas `.mdx` en `src/contenido/ayuda/` (`iniciar-sesion` revisado, `alcance-y-roles`, `consultar-graduados`, `registrar-actas`, `tomos-y-escaneos`, `gestion-usuarios`, `configuracion`, `auditoria`), más entradas en `temas.ts`, `slugs.ts` y `contenido.ts`. Niveles: 1–4 para los cinco primeros; 1–3 para `gestion-usuarios` y `configuracion`; solo 1 para `auditoria`. Cada tema se escribió tras leer la página y la ruta de API correspondiente. `/actas/[id]` es una pantalla de edición (no de solo lectura): `PATCH` exige nivel ≤3 y solo permite agregar estudiantes, no quitarlos. No hay interfaz para firmantes ni para vincular escaneos a un acta, y la consulta no muestra el escaneo del folio; el manual no documenta esas funciones.
  - RED: tras agregar los 7 temas nuevos al catálogo, `temas.test.ts` falló en "cada tema del catálogo tiene su contenido registrado" (esperaba `alcance-y-roles` en la lista de slugs). GREEN: al agregar slugs, cargadores y `.mdx`, pasan 5/5.
  - Commit: pendiente — el usuario no autorizó commits.
- [x] **T8 — Documentación.**
  - Agregar el requerimiento al BRD.
  - Anotar en `docs/frontend-standards.md` cómo agregar un tema.
  - Ruta: delegado (writer trigger: 2+ archivos no triviales).
  - Evidencia: `docs/brd.md` §7.6 "Ayuda en la aplicación (manual de usuario)" (el BRD no tenía "manual de usuario" en una lista de fuera de alcance); `docs/frontend-standards.md` §9 "Manual de usuario (`/ayuda`)", agregada al final sin tocar los cambios de la otra tarea.
  - Commit: pendiente — el usuario no autorizó commits.

## Puntos abiertos

- **Pendiente:** la visibilidad de Auditoría no coincide entre capas: el `Sidebar` la muestra para niveles 1 a 3, la página solo renderiza para el nivel 1 y el BRD (§7.5) y la API la permiten por alcance para todos los niveles. Decisión para el manual: el tema `auditoria` documenta lo que la página muestra hoy (solo nivel 1). Sigue sin resolverse la discrepancia; cuando se defina, ajustar `niveles` del tema.
- **Pendiente:** el BRD (§7.1) dice que el acta es inmutable y que se vincula a firmantes y escaneos, pero la app permite editarla (nivel ≤3) y no tiene interfaz para firmantes ni vínculos. El campo "Acta de referencia (ID)" depende de IDs fijos 2 y 3 en el código, que en la semilla corresponden a "Acta de Notas" y "Traslado".

## Criterios de aceptación

- Cada rol ve en `/ayuda` solo sus temas, y la búsqueda filtra ese índice.
- Si se accede por URL a un tema no permitido, la respuesta es 404.
- El enlace "Ayuda" aparece para los cuatro roles.
- `pnpm verify:fast` y `pnpm build` pasan.

## Chequeos aplicables

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`

## Progreso

T1 a T8 completadas con TDD (sin commits). Verificación de T7/T8: `pnpm vitest run src/contenido src/lib/ayuda src/app/ayuda src/components/ayuda` 30/30; `pnpm lint` sin errores; `pnpm build` exitoso (rutas `/ayuda` y `/ayuda/[slug]` presentes). `pnpm typecheck` falla solo en `src/components/layout/CajonNavegacion.tsx` y `__tests__/Header.test.tsx`, archivos de la tarea concurrente `pulido-ui` (props `menuAbierto`/`onAbrirMenu` aún no existen en `Header`); es un fallo ambiental y no se tocó.

## Siguiente paso

Revisión del usuario de los temas del manual y decisión sobre la visibilidad de Auditoría; después, repetir `pnpm typecheck` cuando `pulido-ui` termine y archivar.
