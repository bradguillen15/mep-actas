# Acta en dos columnas, autoguardado y modales

## Objetivo

Aprovechar mejor el espacio de la pantalla del acta y simplificar la edición: datos del acta a la izquierda, estudiantes a la derecha; autoguardado por campo; agregar estudiantes y folios mediante modales.

## Problema

- La pantalla `/actas/[id]` es una sola columna `max-w-3xl` con mucho espacio vacío.
- Los estudiantes se agregan con filas en línea y se guardan junto con el acta en dos peticiones no atómicas (PATCH + POST).
- La barra «Guardar cambios / Cancelar» no tiene sentido si cada campo se guarda al cambiar.
- Staff (nivel 4) ve el formulario completo pero el PATCH responde 403.
- En `/tomos`, la subida de un folio es una sección en línea, a diferencia del resto de la app que usa modales.

## Decisiones

- Staff (nivel 4) puede corregir los datos del acta: `PATCH /api/actas/[id]` pasa de nivel 3 a 4 dentro de su ámbito. Se actualiza la ayuda (`alcance-y-roles.mdx`) y el BRD si lo menciona.
- Sin modo vista: los campos siempre son editables (decisión del usuario, es el patrón del resto del sistema).
- Autoguardado solo en actas existentes (al perder el foco, si el campo es válido). La creación (`/actas/nueva`) conserva «Guardar acta».
- Agregar estudiante: botón junto al título «Estudiantes registrados» que abre un modal; al enviar hace POST a `/api/actas/[id]/estudiantes` y refresca la tabla.

## Alcance autorizado

`src/app/actas/[id]/`, `src/components/actas/`, `src/lib/actas-cliente.ts`, `src/app/api/actas/[id]/route.ts`, `src/app/tomos/page.tsx`, componentes UI de modal, pruebas asociadas, ayuda/BRD.

## TDD

Modo: activo. Fuente: `CLAUDE.md` del proyecto (§1). Runner: `pnpm test` (Vitest). Verificación completa: `pnpm lint && pnpm typecheck && pnpm test`.

## Tareas

- [x] T1 — Permitir a Staff (nivel 4) actualizar actas en su ámbito (API + pruebas + ayuda/BRD). Ruta: delegada.
- [x] T2 — Pantalla del acta en dos columnas (datos | estudiantes) siempre editable. Ruta: delegada.
- [x] T3 — Autoguardado por campo en modo edición; quitar la barra Guardar/Cancelar en edición. Ruta: delegada.
- [x] T4 — Modal «Agregar estudiante» junto a «Estudiantes registrados». Ruta: delegada.
- [x] T5 — `/tomos`: mover la subida de folio a un modal «Nuevo folio». Ruta: delegada.
- [x] T6 — Un solo flujo para crear y editar: `/actas/nueva` usa la misma pantalla de dos columnas; el acta se crea automáticamente cuando todos los campos requeridos son válidos y luego autoguarda como en edición. Antes de crearla, «Agregar estudiante» queda deshabilitado; si se sale con datos incompletos, no se crea nada (sin borradores ni cambio de esquema; decisión del usuario). Ruta: delegada.

Disparador de delegación: 2+ archivos no triviales por tarea.

## Criterios de aceptación

- En pantallas ≥ lg, datos y estudiantes lado a lado; en móvil se apilan.
- Cambiar un campo válido y salir de él guarda sin botón, con indicación de guardado/error.
- Agregar estudiante desde el modal lo muestra en la tabla sin recargar.
- Staff puede corregir un acta de su escuela; fuera de su ámbito responde 404.
- La subida de folios en `/tomos` ocurre en un modal.

## Progreso

Commits solo por pedido explícito del usuario (regla del proyecto); todo queda sin commitear.

- T1: RED observado (2 pruebas de PATCH Staff fallaban); GREEN con `pnpm test actas/` (52 pasan). Ayuda, BRD y spec `autenticacion-roles` actualizados.
- T2/T3/T4: `DetalleActa.test.tsx` (13 pruebas: vista, edición, autoguardado, modal) RED por módulo inexistente, luego GREEN; página `[id]` con prueba Editar/Listo; `FormularioActa` queda solo para crear (6 pruebas). `pnpm test actas/`: 64 pasan.
- T5: 5 pruebas nuevas del modal «Nuevo folio» en rojo antes de implementar; luego `pnpm test tomos/` 15 pasan.
- Verificación final: ver reporte (lint, typecheck, test).
- Cambio del usuario: se eliminó el modo vista/edición (sin Editar/Listo, `DatosActaVista` borrado). Pruebas ajustadas en rojo (12 fallaban) y luego en verde.
- T6: `src/app/actas/nueva/__tests__/page.test.tsx` (8 pruebas) en rojo contra la página anterior, luego verde. `EdicionDatosActa`/`DetalleActa` aceptan «sin acta»; creación automática con candado y `router.replace`. Eliminados `FormularioActa`, `FilaEstudiante`, `crearActaConEstudiantes` (cliente) y sus pruebas; tipos en `components/actas/tipos.ts`; `crearActa` en `actas-cliente`.
