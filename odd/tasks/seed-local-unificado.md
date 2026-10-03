# Seed local unificado

## Objetivo

El entorno local siempre arranca con datos de prueba completos (mock) para explorar la app con cualquier rol, y las pruebas E2E usan ese mismo conjunto de datos.

## Problema

- Los datos locales están repartidos en dos scripts (`scripts/init-local-db.ts` y `scripts/seed-datos-demo.ts`); el segundo es opcional y nunca se ejecutó, así que Admin País veía 0 actas.
- `test/e2e/globalSetup.ts` tiene una tercera copia divergente (sin regiones ni escuelas, 3 roles con usuario).
- La idempotencia se basa en `COUNT(*)` por tabla y los IDs están fijos en el código.

## Alcance autorizado

- Un único módulo de seed reutilizable (catálogos + usuarios de los 4 roles + escuelas en varias regiones + actas, graduados, firmantes y escaneos de prueba).
- Idempotente por clave natural (email, identificación, `codigo_mep`, nombre de catálogo); se ejecuta en cada `pnpm dev`.
- Se niega a ejecutarse contra una URL que no sea `file:` (nunca sembrar Turso remoto).
- `pnpm db:reiniciar` borra el archivo local y lo regenera.
- `globalSetup` E2E reutiliza el mismo dataset; prueba E2E de humo por rol que verifica datos visibles según su ámbito.
- Actualizar referencias (package.json, launch.json, CI, docs, `.env.example`, página de inicio de sesión si muestra credenciales).

## Restricciones

- Todo en español (código, nombres, mensajes, commits).
- Sin comentarios redundantes; tipado estricto.
- TDD activo (CLAUDE.md del proyecto), runner: Vitest (`pnpm test`, `pnpm test:e2e`).

## Tareas

- [x] T1 — Módulo de seed unificado + scripts `dev`/`db:sembrar`/`db:reiniciar` + borrar scripts viejos (ruta: delegado, disparador: 2+ archivos no triviales)
- [ ] T2 — `globalSetup` E2E usa el dataset compartido; ajustar pruebas E2E que asuman BD vacía; prueba de humo por rol (ruta: delegado)
- [x] T3 — Actualizar docs, CI, launch.json y referencias (ruta: delegado)

## Verificación

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`
- Ejecutar el seed dos veces sobre una BD nueva: sin duplicados.

## Progreso

- Rama: `feat/gestion-usuarios-jerarquia`.
- T1 completada: módulo `src/db/semilla/`, scripts `db:sembrar`/`db:reiniciar`, scripts viejos eliminados (commit 6f830a5).
- T2 completada: `globalSetup` usa la semilla compartida; helpers por correo local; `test/e2e/semilla-por-rol.test.ts` (commits 5627cd5, 2705c66).
- T3 completada: launch.json, CI, docs, página de inicio de sesión y README actualizados. `.env.example` no se pudo editar (acceso denegado por permisos); pendiente de actualización manual.
- Verificación: lint, typecheck, `pnpm test` (322), `pnpm test:e2e` (82) en verde; reinicio + doble siembra sin duplicados.
