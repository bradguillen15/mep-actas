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

- [Estándares de Backend](./backend-standards.md) - API (route handlers de Next.js), acceso a datos con Drizzle/Turso, pruebas, seguridad y buenas prácticas de backend
- [Estándares de Frontend](./frontend-standards.md) - Componentes React/Next.js, lineamientos de UI/UX y arquitectura de frontend
- [Estándares de Documentación](./documentation-standards.md) - Estructura, formato y mantenimiento de la documentación técnica, incluyendo estándares de IA como este documento
- [Pasos Obligatorios de Tareas OpenSpec](./openspec-tasks-mandatory-steps.md) - Checklist y reglas de ejecución obligatorias al crear o actualizar archivos `tasks.md` de OpenSpec
- [BRD del producto](./brd.md) - Documento de requerimientos de negocio; fuente de verdad del producto

## 4. Skills del proyecto

- Las skills viven en `ai-specs/skills`.
- Cuando una solicitud coincida con una skill, carga y sigue el `SKILL.md` correspondiente automáticamente antes de continuar.
- Carga también cualquier archivo referenciado dentro de la carpeta de la skill (por ejemplo, `references/*.md`) cuando la skill lo requiera.

## 5. Requisito de modelo para planificación

Los flujos de planificación deben ejecutarse con Opus en razonamiento alto.

Aplica a:
- `enrich-us`
- `openspec-ff-change`
- `openspec-continue-change`

Antes de iniciar cualquiera de estos flujos, verifica que la sesión use Opus en razonamiento alto. Si no lo está, **autocorrige** agregando `"model": "claude-opus-4-8"` a `.claude/settings.json` (usa la skill `update-config` o edítalo directamente) y luego continúa — no te detengas a preguntar. Haz lo mismo para volver a Sonnet medio en cualquier otro paso.

## 6. Integridad de symlinks y portabilidad multi-agente

- **Fuente canónica**: Mantén los artefactos reutilizables en `ai-specs` como fuente canónica. Las rutas específicas de cada agente (como `.claude` y `.cursor`) deben referenciarlos mediante symlinks cuando sea posible.
- **Seguridad al actualizar**: Cada vez que un archivo se renombre, mueva o cambie su sufijo, verifica y actualiza todos los symlinks que lo apuntan antes de dar por completado el cambio.
- **Enlace de nuevos artefactos**: Cada vez que crees un artefacto nuevo que requiera exposición multi-agente (por ejemplo, nuevos agentes o skills en `ai-specs`), crea los symlinks correspondientes desde las rutas de referencia esperadas de cada agente.
- **Revisión de personalización externa**: Cada vez que se introduzca una personalización fuera de `ai-specs`, evalúa si debería moverse a `ai-specs` y reemplazarse con symlinks desde las ubicaciones originales.
- **Compuerta de finalización**: Un cambio está incompleto si deja symlinks rotos, destinos obsoletos o artefactos canónicos duplicados entre carpetas específicas de agentes.

## 7. Actualización obligatoria de artefactos OpenSpec para cambios posteriores a apply

Cuando aparezca una nueva solicitud de arreglo/cambio después de `opsx:apply` (o `/apply`) y antes de `opsx:archive` (o `/archive`), los agentes deben tratarla primero como una actualización de spec, no como un "arréglalo rápido" informal. Es el principio central de OpenSpec: la documentación es la fuente de verdad.

Orden requerido:

1. Actualiza los artefactos del cambio OpenSpec actual que estén afectados (por ejemplo: escenarios, requisitos/specs y `tasks.md`). No agregues las tareas como "bugfixes" sino como parte del diseño inicial, en la sección correspondiente.
2. Si se requiere regenerar artefactos, ejecuta el paso correspondiente de OpenSpec (`opsx:continue`, `opsx:ff` o equivalente) antes de programar.
3. Implementa el código solo después de que los artefactos reflejen la nueva solicitud.
4. Vuelve a ejecutar la verificación contra los artefactos actualizados antes de archivar.

No apliques arreglos directos solo de código en esta ventana sin actualizar los artefactos OpenSpec.
