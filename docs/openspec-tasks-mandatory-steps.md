---
description: Pasos obligatorios al crear archivos tasks.md de OpenSpec y reglas de ejecución de pruebas para el agente. Stack Next.js + Drizzle/Turso + Vitest (unitarias y E2E). Todo en español.
alwaysApply: true
---

# Tareas OpenSpec: pasos obligatorios

Al crear o actualizar archivos `tasks.md` en cambios de OpenSpec, DEBES seguir estas reglas. Todo el contenido va en español.

## 1. Leer primero `openspec/config.yaml`

**ANTES** de crear o actualizar cualquier `tasks.md`, lee `openspec/config.yaml` para entender:
- Las reglas de backend y frontend del proyecto.
- La convención de ramas.
- La estructura requerida de tareas.
- Los requisitos de pruebas y documentación.

Lee también `docs/base-standards.md`, `docs/brd.md` y el estándar de backend/frontend que aplique.

## 2. Pasos obligatorios (en orden)

Toda lista de tareas de implementación DEBE incluir:

- **Paso 0 — Crear rama de feature (PRIMERO):** `feat/[nombre-cambio]`. Crear y cambiarse a la rama antes de tocar código.
- **TDD por tarea:** escribir la prueba que falla (Vitest) → implementar hasta ponerla en verde.
- **Paso N — Revisar/actualizar pruebas existentes** afectadas por el cambio.
- **Paso N+1 — Ejecutar las pruebas (Vitest)** y dejarlas en verde. El agente las ejecuta; restaura el estado de la base tras pruebas que escriben.
- **Paso N+2 — Verificación E2E** (Vitest contra SQLite real, `pnpm test:e2e`) cuando el cambio toca la persistencia o un flujo de usuario. El agente la ejecuta.
- **Paso N+3 — Actualizar la documentación técnica** (`docs/data-model.md`, `docs/api-spec.yml`, `*-standards.md` según corresponda).

> No se usa "curl manual": la API (route handlers de `app/api`) se prueba con pruebas de route handlers/servicios (Vitest) y con E2E (Vitest contra SQLite, `test/e2e/**`). No se requieren reportes-artefacto por paso; basta con dejar las pruebas en verde y documentar lo necesario.

## 3. El agente ejecuta las pruebas — nunca las delega

**IMPORTANTE:** el agente DEBE ejecutar él mismo las pruebas para poder marcar una tarea como completada. **Nunca** le pidas al usuario que corra las pruebas.

### Pruebas con Vitest (Paso N+1)
1. Prepara el entorno (dependencias, base de prueba disponible).
2. Ejecuta primero las pruebas enfocadas del módulo modificado; confirma que pasan y que no hay regresiones.
3. Ejecuta la suite requerida según `openspec/config.yaml`.
4. Si una prueba escribió en la base, **restaura el estado**.
5. Marca el paso como completado solo cuando las pruebas están en verde (o se documenta una excepción aprobada).

### E2E con Vitest contra SQLite (Paso N+2, cuando aplica)
Aplica cuando el cambio afecta la persistencia, las consultas SQL o un flujo de usuario.
1. Ejecuta `pnpm test:e2e`: las pruebas de `test/e2e/**/*.test.ts` usan los servicios reales contra `temp-e2e.db`, creada y migrada por `test/e2e/globalSetup.ts`.
2. Cubre los casos de error/validación y verifica la persistencia cuando el flujo crea o edita.
3. Limpia en `afterAll` los datos que la prueba creó (incluida la auditoría de sus escuelas y regiones con `limpiarAuditoriaDeAmbito`).
4. Si cambia la interfaz, verifica además el flujo en el navegador con `pnpm dev`.

## 4. Checklist de verificación

Antes de finalizar un `tasks.md`, verifica:
- [ ] El Paso 0 (crear rama de feature) es el primero.
- [ ] Se incluyen todos los pasos obligatorios de `openspec/config.yaml`.
- [ ] Los pasos están numerados secuencialmente.
- [ ] Se sigue TDD (prueba que falla antes de implementar).
- [ ] Hay un paso de ejecución de pruebas (Vitest) que el agente ejecuta.
- [ ] Hay verificación E2E (`pnpm test:e2e`) si el cambio toca la persistencia o un flujo de usuario.
- [ ] Hay un paso de actualización de documentación.
- [ ] Las tareas con escritura en base incluyen restauración del estado.

## 5. Cuándo aplica

- Al crear `tasks.md` con `/gentle-sdd-ff` o `/gentle-sdd-continue` (fase de tareas de Gentle AI).
- Al actualizar archivos `tasks.md` existentes.
- Al implementar tareas con `/gentle-sdd-apply` — el agente ejecuta las pruebas.

## 6. Estructura de ejemplo

```markdown
## 0. Preparación: crear rama de feature (OBLIGATORIO — PRIMER PASO)
- [ ] 0.1 Crear rama `feature/registro-actas` desde main
- [ ] 0.2 Verificar la rama actual

## 1. Backend: pruebas del servicio (TDD)
- [ ] 1.1 Escribir prueba(s) que fallan para el servicio de actas
...

## 5. Backend: ejecutar pruebas (Vitest) (OBLIGATORIO)
- [ ] 5.1 Ejecutar pruebas enfocadas del módulo modificado
- [ ] 5.2 Ejecutar la suite requerida
- [ ] 5.3 Restaurar el estado de la base si alguna prueba escribió
- [ ] 5.4 Marcar completo solo con las pruebas en verde

## 6. E2E (OBLIGATORIO si aplica)
- [ ] 6.1 Agregar o adaptar pruebas en `test/e2e/**/*.test.ts`
- [ ] 6.2 Ejecutar `pnpm test:e2e` y dejarlo en verde
- [ ] 6.3 Probar escenarios de error/validación
- [ ] 6.4 Limpiar los datos de prueba en `afterAll`
- [ ] 6.5 Si cambió la interfaz, verificar el flujo en el navegador con `pnpm dev`

## 7. Actualizar documentación técnica (OBLIGATORIO)
- [ ] 7.1 Actualizar docs/data-model.md y/o docs/api-spec.yml según el cambio
```

## 7. Requisitos de ejecución del agente

Al implementar tareas (`/gentle-sdd-apply`), el agente DEBE:
1. **Ejecutar todas las pruebas él mismo** (`pnpm test` y, si aplica, `pnpm test:e2e`); levantar la app si hace falta; verificar resultados; restaurar el estado de la base.
2. **Marcar tareas como completadas (`[x]`)** solo después de que las pruebas pasen, se verifiquen los resultados y se restaure el estado.
3. **Nunca delegar las pruebas** al usuario ni marcar tareas sin ejecutarlas.
4. **Documentar** lo necesario: qué se probó, resultados y cualquier problema y su resolución.

## Incumplimiento

Si creas tareas sin estos pasos obligatorios, el usuario tendrá que corregir el `tasks.md` manualmente. Lee siempre `openspec/config.yaml` primero. **Si implementas tareas sin ejecutar tú mismo las pruebas, estás violando esta regla.**
