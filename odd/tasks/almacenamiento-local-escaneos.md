# Almacenamiento local de escaneos

## Objetivo

En desarrollo local, sin cuenta de Cloudflare R2, se pueden adjuntar y ver escaneos de tomos, y el seed trae imágenes de prueba ("Tomo 12 · Folio 3") para cada folio. Producción sigue usando R2.

## Problema

- El almacenamiento es solo R2 (`src/server/almacenamiento/r2.util.ts`, `r2.cliente.ts`); sin variables `R2_*`, `GET /api/escaneos` responde 500 y la página de Tomos se rompe aunque haya escaneos sembrados.
- El seed solo siembra los folios 1 y 2 de cada tomo y usa un formato de clave distinto al de la app (`construirClave`).
- La subida en Tomos envía `image/pdf` en vez de `application/pdf`.

## Decisiones

- Turso no es almacenamiento de archivos (el BLOB cuenta contra la cuota del plan, `VACUUM` está deshabilitado); los escaneos van a almacenamiento de objetos: R2 en producción, disco local en desarrollo.
- Modo local activo solo si `NODE_ENV === "development"` y R2 no está configurado. En producción, la falta de variables R2 sigue lanzando error (spec `almacenamiento-r2`).
- Las imágenes del seed son solo locales (el seed ya rechaza URLs que no sean `file:`).

## Alcance autorizado

- Puerto de almacenamiento con adaptadores R2 y local (carpeta ignorada por git); el servicio de escaneos depende del puerto.
- Rutas de desarrollo para subir (PUT) y leer (GET) archivos locales, con sesión y ámbito, inaccesibles fuera de desarrollo.
- El seed genera imágenes PNG por folio (rango completo de cada acta) en el almacenamiento local, con la clave de `construirClave`.
- Corregir el tipo de contenido de PDF en la subida.
- Spec delta en `openspec/specs/almacenamiento-r2/spec.md` para el modo local.

## Restricciones

- Todo en español; tipado estricto; sin comentarios redundantes.
- TDD activo (CLAUDE.md del proyecto), runner Vitest (`pnpm test`, `pnpm test:e2e`).

## Tareas

- [x] T1 — Puerto de almacenamiento + adaptador local + rutas de desarrollo; servicio de escaneos usa el puerto; corregir `application/pdf` (ruta: delegado)
- [x] T2 — Seed con imágenes PNG por folio en almacenamiento local y claves de `construirClave`; ajustar pruebas (ruta: delegado)
- [x] T3 — Spec `almacenamiento-r2`, README y docs (ruta: delegado)

## Verificación

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`
- `pnpm db:reiniciar` y ver un folio en `/tomos` con `pnpm dev:local`.

## Progreso

- Rama: `feat/gestion-usuarios-jerarquia`.
- T1 completada: commit `22fb4e5` (puerto `AlmacenamientoEscaneos`, adaptadores R2 y local, rutas `/api/almacenamiento-local/[...clave]`, `Content-Type` correcto para PDF).
- T2 completada: commit `82ea8cc` (semilla con un escaneo por folio, claves de `construirClave`, 143 imágenes PNG generadas con sharp; `db:reiniciar` vacía el almacenamiento local).
- T3 completada: commit `9fc04c7` (spec `almacenamiento-r2`, README, estándares de backend). Verificación: lint, typecheck, test (407), test:e2e (82) en verde; `db:reiniciar` generó 143 imágenes.
