---
description: Este documento contiene todas las reglas y lineamientos de desarrollo de este proyecto, aplicables a todos los agentes de IA (Claude, Cursor, Codex, Gemini, etc.).
alwaysApply: true
---

## 1. Principios fundamentales

- **Tareas pequeñas, una a la vez**: Trabaja siempre en pasos cortos, de uno en uno. Nunca avances más de un paso.
- **Desarrollo guiado por pruebas (TDD)**: Comienza con pruebas que fallen para cualquier funcionalidad nueva, según el detalle de la tarea.
- **Tipado seguro**: Todo el código debe estar completamente tipado.
- **Nombres claros**: Usa nombres claros y descriptivos para todas las variables y funciones.
- **Comentarios mínimos**: No escribas comentarios por defecto. Deja que los nombres claros y la estructura hagan el código auto-explicativo. Agrega un comentario SOLO cuando explique algo que el código no puede — una razón no obvia ("por qué"), un caso borde, una trampa o un supuesto externo. Nunca agregues comentarios que repitan lo que el código hace (p. ej. banners divisores como `// ---- Categorías ----`, o `// construir el mapa` sobre un `.map`). Al editar código existente, elimina los comentarios redundantes que encuentres.
- **Cambios incrementales**: Prefiere cambios pequeños y enfocados sobre modificaciones grandes y complejas.
- **Commits solo por pedido explícito**: Nunca hagas `git commit` ni `git push` a menos que el usuario lo pida explícitamente en ese momento. Deja los cambios sin commitear para que el usuario los revise. Esta regla tiene prioridad sobre cualquier flujo (ODD, SDD, skills) que indique commitear por tarea; también aplica a los subagentes. `.claude/settings.json` exige confirmación para `git commit` y `git push`.
- **Cuestiona los supuestos**: Cuestiona siempre los supuestos e inferencias.
- **Detección de patrones**: Detecta y resalta patrones de código repetidos.

## 2. Estándar de idioma

- **Solo español (Costa Rica)**: Todos los artefactos del proyecto deben escribirse en español, ya que es un producto para el Gobierno de Costa Rica. Esto incluye:
    - Código (variables, funciones, clases, comentarios, mensajes de error, mensajes de log)
    - Documentación (README, guías, documentación de API)
    - Tickets (títulos, descripciones, comentarios)
    - Esquemas de datos y nombres de base de datos (tablas y columnas en español: `actas`, `numero_tomo`, …)
    - Archivos de configuración y scripts
    - Mensajes de commit de Git (la descripción en español; se mantiene el prefijo de Conventional Commits, p. ej. `feat:`, `fix:`)
    - Nombres y descripciones de las pruebas
- **Excepción técnica**: las palabras reservadas de lenguajes/frameworks, los nombres de paquetes y las APIs de terceros se mantienen en su forma original (no se traducen).

## 3. Estándares específicos

Para estándares y lineamientos detallados de cada área del proyecto, consulta:

- [Estándares de Backend](./docs/backend-standards.md) - API (route handlers de Next.js), acceso a datos con Drizzle/Turso, pruebas, seguridad y buenas prácticas de backend
- [Estándares de Frontend](./docs/frontend-standards.md) - Componentes React/Next.js, lineamientos de UI/UX y arquitectura de frontend
- [Estándares de Documentación](./docs/documentation-standards.md) - Estructura, formato y mantenimiento de la documentación técnica, incluyendo estándares de IA como este documento
- [Pasos Obligatorios de Tareas OpenSpec](./docs/openspec-tasks-mandatory-steps.md) - Checklist y reglas de ejecución obligatorias al crear o actualizar archivos `tasks.md` de OpenSpec
- [BRD del producto](./docs/brd.md) - Documento de requerimientos de negocio; fuente de verdad del producto

## 4. Flujo de trabajo con IA (Gentle AI)

- El proyecto usa **Gentle AI** (desarrollo guiado por specs, SDD) con persistencia `openspec`. Gentle AI se instala a nivel global; el repositorio no contiene skills, agentes ni comandos propios.
- Los artefactos de cada cambio viven en `openspec/changes/<cambio>/` (propuesta, specs, diseño, tareas) y los specs vigentes en `openspec/specs/`. Los cambios cerrados se mueven a `openspec/changes/archive/`.
- Flujo: `/gentle-sdd-new <cambio>` → `/gentle-sdd-ff` (o `/gentle-sdd-continue` paso a paso) → `/gentle-sdd-apply` → `/gentle-sdd-verify` → `/gentle-sdd-archive`. Estado: `/gentle-sdd-status`.
- **Idioma de los artefactos**: Gentle AI genera en inglés por defecto; en este proyecto todos los artefactos SDD se escriben en español (ver sección 2).
- Antes de crear artefactos o implementar, leer el BRD y los estándares de la sección 3; al crear `tasks.md`, aplicar los [Pasos Obligatorios de Tareas](./docs/openspec-tasks-mandatory-steps.md).

## 5. Cambios posteriores a apply: primero los artefactos

Cuando aparezca una nueva solicitud de arreglo o cambio después de `apply` y antes de `archive`, se trata primero como una actualización de spec, no como un arreglo rápido: la documentación es la fuente de verdad.

Orden requerido:

1. Actualiza los artefactos del cambio actual que estén afectados (escenarios, requisitos/specs y `tasks.md`). Las tareas nuevas se agregan como parte del diseño, en la sección correspondiente, no como "bugfixes".
2. Si hace falta regenerar artefactos, ejecuta la fase correspondiente (`/gentle-sdd-continue` o `/gentle-sdd-ff`) antes de programar.
3. Implementa el código solo después de que los artefactos reflejen la nueva solicitud.
4. Vuelve a ejecutar la verificación (`/gentle-sdd-verify`) antes de archivar.
