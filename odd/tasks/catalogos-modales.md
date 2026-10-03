# Catálogos con modales de creación

## Objetivo

Admin País puede crear regiones y escuelas desde la UI, y Admin Regional escuelas de su región, usando un modal de formulario reutilizable. Regiones y Escuelas pasan a ser tabs propios en `/configuracion`.

## Problema

- `RegionesLista` y `EscuelasLista` (`src/app/configuracion/page.tsx`) son de solo lectura: no hay botón ni formulario, aunque la API ya permite `POST /api/regiones` (nivel 1) y `POST /api/escuelas` (nivel ≤ 2).
- El tab "Catálogos" apila ambas tablas; la tabla de escuelas muestra el ID de región en vez del nombre.
- Cada formulario de creación arma su propio modal o formulario en línea.

## Decisiones

- Actas se mantiene como página (`/actas/nueva`): formulario largo con graduados dinámicos.
- Modal reutilizable para regiones, escuelas y tipos de acta (y usuarios si el cambio es mecánico).
- BRD L111-114: Admin País gestiona regiones y escuelas; Admin Regional gestiona escuelas de su región.

## Alcance autorizado

- Componente `ModalFormulario` reutilizable sobre `src/components/ui/Modal.tsx`.
- Tabs en `/configuracion`: Usuarios · Tipos de acta · Regiones · Escuelas (se elimina "Catálogos").
- "Nueva región" solo nivel 1; "Nueva escuela" nivel ≤ 2 (Admin Regional con su región fija).
- Tabla de escuelas muestra el nombre de la región.
- Tipos de acta migran del formulario en línea al modal.

## Restricciones

- Todo en español; tipado estricto; sin comentarios redundantes.
- TDD activo (CLAUDE.md del proyecto), runner Vitest (`pnpm test`).
- Sin cambios de API salvo que una prueba demuestre un defecto.

## Tareas

- [x] T1 — `ModalFormulario` reutilizable con pruebas (ruta: delegado)
- [x] T2 — Tabs Regiones y Escuelas con creación por modal y control por nivel; tipos de acta al modal (ruta: delegado, disparador: 2+ archivos no triviales)
- [x] T3 — Eliminar el tab Usuarios de `/configuracion` y `GestionUsuarios.tsx`: era una copia rota de `/usuarios` (columna `rol` inexistente en la API, sin activar/desactivar, creación sin `funcionarioId`/`rolId`). `/usuarios` queda como única pantalla de usuarios (ruta: delegado)
- [ ] T4 — Migrar "Nuevo usuario" de `/usuarios` a `ModalFormulario` conservando funcionario, rol, validaciones y pruebas (ruta: delegado, disparador: 2+ archivos no triviales)

## Verificación

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`

## Progreso

- Rama: `feat/gestion-usuarios-jerarquia`.
- T1 (ea3115a): `ModalFormulario` sobre `Modal`, 9 pruebas (RED observado: módulo inexistente; GREEN).
- T2 (ee01690): pestañas Usuarios/Tipos de acta/Regiones/Escuelas; secciones extraídas a `src/components/configuracion/`; `src/lib/api-cliente.ts`; Nuevo usuario migrado a `ModalFormulario`. Verificación: lint, typecheck, test (347) y test:e2e (82) en verde.
