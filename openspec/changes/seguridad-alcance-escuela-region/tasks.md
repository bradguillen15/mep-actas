# Tareas: Seguridad por ámbito de escuela y región

## Pronóstico de carga de revisión

| Campo | Valor |
|-------|-------|
| Líneas cambiadas estimadas | 2.200 – 3.000 (código, pruebas, migración, documentación; el diseño no da una cifra) |
| Riesgo frente al presupuesto de 400 líneas | Alto |
| PR encadenados recomendados | No (decisión del usuario: PR único; las ~400 líneas por unidad son solo orientativas) |
| División sugerida | Un solo PR con 11 unidades de trabajo y un commit convencional descriptivo por tarea |
| Estrategia de entrega | single-pr |
| Estrategia de cadena | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

Decisión (2026-09-29): el usuario confirmó un PR único con `size:exception`. Para que la revisión siga siendo legible, cada tarea que cambie código, pruebas o documentación se cierra con su propio commit convencional descriptivo (prefijo en inglés, descripción en español); los mensajes sugeridos al final de cada sección sirven de guía. Todo el trabajo vive en la rama `feat/gestion-usuarios-jerarquia`.

Configuración de pruebas: TDD estricto activo. Ejecutor unitario/ruta: `pnpm test` (Vitest). E2E: `pnpm test:e2e` (Vitest contra SQLite real en `test/e2e/**`; no es Playwright aunque `openspec/config.yaml` lo mencione). Verificación rápida por unidad: `pnpm verify:fast`. Verificación completa final: `pnpm verify`.

### Unidades de trabajo sugeridas

| Unidad | Objetivo | PR probable | Comando de prueba enfocado | Arnés de ejecución | Límite de reversión |
|--------|----------|-------------|----------------------------|--------------------|---------------------|
| 1 | Tipo `AmbitoConsulta`, errores tipados y regla nueva de `verificarRol` | PR único | `pnpm vitest run src/server/auth` | N/A: funciones puras, sin flujo de usuario | `src/server/auth/ambito.ts`, `src/server/errores.ts` y el cambio en `autorizacion.servicio.ts` |
| 2 | Constructor de condiciones SQL y migración de índices | PR único | `pnpm vitest run src/server/repositorios src/db` | `pnpm db:init-local` aplica la migración 0002 sin error | `ambito.condiciones.ts`, `drizzle/0002_*` y los índices en `esquema.ts` |
| 3 | Actas con ámbito, IDOR y nivel 4 en estudiantes/firmantes | PR único | `pnpm vitest run src/app/api/actas src/server/servicios` | `pnpm test:e2e -- actas` | Rutas y servicio de actas |
| 4 | Graduaciones con ámbito | PR único | `pnpm vitest run graduaciones` | `pnpm test:e2e -- graduaciones` | Repositorio, servicio y rutas de graduaciones |
| 5 | Escaneos con ámbito, sin URL firmada ajena, DELETE 404 | PR único | `pnpm vitest run src/app/api/escaneos src/server/servicios/__tests__/escaneos.servicio.test.ts` | `pnpm test:e2e -- escaneos` | Repositorio, servicio y rutas de escaneos |
| 6 | Consulta exacta de persona, `POST /api/personas` nivel 4 y corrección de la interfaz | PR único | `pnpm vitest run personas` | `pnpm test:e2e -- personas`; flujo de alta de estudiante en `pnpm dev:local:demo` | Personas (ruta, servicio, repositorio) y las dos páginas de actas |
| 7 | Personas y funcionarios con ámbito y PATCH con ámbito | PR único | `pnpm vitest run personas funcionarios` | `pnpm test:e2e -- funcionarios personas` | Repositorios, servicios y rutas de personas y funcionarios |
| 8 | Usuarios con ámbito y unificación de la regla | PR único | `pnpm vitest run usuarios` | `pnpm test:e2e -- usuarios` | Repositorio, servicio y rutas de usuarios |
| 9 | Auditoría con `escuela_id`/`region_id` y lectura por ámbito | PR único | `pnpm vitest run auditoria regiones escuelas` | `pnpm db:init-local` aplica la migración 0003; `pnpm test:e2e -- auditoria` | Migración 0003, columnas de `esquema.ts`, auditoría y `Auditor` |
| 10 | Prueba e2e de conformidad de ámbito | PR único | `pnpm test:e2e -- alcance-datos` | Es el propio arnés contra SQLite real (`temp-e2e.db`) | `test/e2e/alcance-datos.test.ts` |
| 11 | Documentación técnica, BRD y diagrama | PR único | N/A: solo documentación | N/A: sin comportamiento de ejecución | `docs/**` y `openspec/changes/seguridad-alcance-escuela-region/tasks.md` |

Orden: las unidades siguen el orden de implementación del diseño (10 pasos), con la sección 0 de preparación y la sección 12 de verificación final. Decisión (2026-09-29): la base no se ha publicado, así que todo el esquema vive en una sola migración inicial `drizzle/0000_*.sql` que se regenera en cada cambio del esquema; no hay relleno histórico.

## 0. Preparación: rama de feature (OBLIGATORIO, PRIMER PASO)

- [x] 0.1 Verificar la rama actual con `git branch --show-current`. La rama de trabajo es `feat/gestion-usuarios-jerarquia` (rama única del trabajo en curso, ya publicada); no crear otra.
- [x] 0.2 Confirmar que el árbol de trabajo está limpio (`git status`) y ejecutar `pnpm verify:fast` como línea base; registrar cualquier falla previa antes de continuar. Línea base: lint y typecheck OK; Vitest 31 archivos, 146 pruebas en verde.
- [x] 0.3 Releer `docs/brd.md` §6/§7.5, `docs/backend-standards.md` y `docs/frontend-standards.md`, y las specs `alcance-datos`, `autenticacion-roles`, `gestion-usuarios` y `auditoria` del cambio.

## 1. Fundamentos de ámbito: `AmbitoConsulta`, errores y `verificarRol` (TDD)

Requisitos: spec `alcance-datos` (regla de ámbito por nivel) y `autenticacion-roles` (autorización con región resuelta). Diseño: Decisiones 1, 2, 5 y 7.

- [x] 1.1 RED: crear `src/server/auth/__tests__/ambito.test.ts` con tabla de casos para `derivarAmbitoConsulta` (nivel 1 → `pais`; nivel 2 con `regionId` → `region`; nivel 2 sin `regionId` → `ninguno`; niveles 3 y 4 con `escuelaId` → `escuela`; niveles 3 y 4 sin `escuelaId` → `ninguno`) y para `escuelasDentroDeAmbito` (los cuatro tipos). Confirmar que falla.
- [x] 1.2 GREEN: crear `src/server/auth/ambito.ts` con el tipo `AmbitoConsulta`, `derivarAmbitoConsulta(sesion)` y `escuelasDentroDeAmbito(ambito, escuelaIds, regionIds)` según las firmas del diseño.
- [x] 1.3 RED: crear `src/server/__tests__/errores.test.ts` que verifique que `ErrorNoEncontrado` tiene `name === "NotFoundError"` y `ErrorProhibido` tiene `name === "ForbiddenError"`, y que ambos son instancias de `Error`.
- [x] 1.4 GREEN: crear `src/server/errores.ts` con `ErrorNoEncontrado` y `ErrorProhibido`.
- [x] 1.5 RED: agregar casos a `src/server/auth/__tests__/autorizacion.test.ts`: nivel 2 con `escuelaId` de otra región → `403`; nivel 2 con `escuelaId` de su región → autorizado; nivel 2 con `escuelaId` y sin `regionId` → `403` (falla cerrado); nivel 2 con solo `regionId` ajeno → `403`; niveles 3–4 con `escuelaId` distinto → `403`; nivel 1 autorizado; casos actuales intactos.
- [x] 1.6 GREEN: modificar `src/server/auth/autorizacion.servicio.ts` con la regla del nivel 2 + `escuelaId` (exige `regionId` de la escuela) y documentar en `src/server/auth/tipos.ts` la semántica de `AmbitoVerificacion.regionId` (región de la escuela objetivo) sin cambiar su forma.
- [x] 1.7 REFACTOR: revisar nombres y eliminar comentarios redundantes en los archivos tocados; ejecutar `pnpm vitest run src/server/auth src/server/__tests__` y luego `pnpm verify:fast`; dejar todo en verde.
- [x] 1.8 Commit sugerido: `feat: agregar ámbito de consulta, errores tipados y regla de región en verificarRol`

## 2. Condiciones SQL de ámbito e índices (TDD)

Diseño: Decisiones 1 y 6.

- [x] 2.1 RED: crear `src/server/repositorios/__tests__/ambito.condiciones.test.ts` que, contra una base SQLite en memoria o de prueba, verifique que `condicionEscuelaEnAmbito` devuelve `undefined` para `pais`, filtra por igualdad para `escuela`, filtra por subconsulta de `escuelas.region_id` para `region` y no devuelve filas para `ninguno`.
- [x] 2.2 GREEN: crear `src/server/repositorios/ambito.condiciones.ts` con `condicionEscuelaEnAmbito(ambito, columnaEscuelaId)` (`pais` → `undefined`; `region` → `IN (SELECT id FROM escuelas WHERE region_id = ?)`; `escuela` → `=`; `ninguno` → ``sql`0 = 1` ``).
- [x] 2.3 RED: agregar a `src/db/__tests__/esquema.test.ts` la verificación de los índices `idx_escuelas_region_id`, `idx_funcionario_escuela_funcionario_id`, `idx_funcionario_escuela_escuela_id`, `idx_acta_estudiantes_acta_id`, `idx_acta_estudiantes_estudiante_id`, `idx_estudiantes_persona_id`, `idx_funcionarios_persona_id`, `idx_acta_firmantes_acta_id` e `idx_acta_firmantes_funcionario_id`.
- [x] 2.4 GREEN: declarar los índices en la función de configuración de cada `sqliteTable` en `src/db/esquema.ts` (patrón de `actas`, `escaneos` y `personas`). No incluir aún los índices de auditoría.
- [x] 2.5 Generar la migración aditiva con `pnpm exec drizzle-kit generate` (no existe un script `db:generate` en `package.json`; no inventarlo) y revisar que `drizzle/0002_*.sql` solo contenga `CREATE INDEX`. Aplicarla con `pnpm db:init-local` y confirmar que no falla.
- [x] 2.6 REFACTOR y verificación: `pnpm vitest run src/server/repositorios src/db` y `pnpm verify:fast` en verde.
- [x] 2.8 Consolidar `drizzle/0000_*`, `0001_*` y `0002_*` en una sola migración inicial regenerada con `pnpm exec drizzle-kit generate`; recrear la base local (`mep-actas-local.db`) y de prueba (`temp-e2e.db`) y confirmar `pnpm db:init-local`, `pnpm verify:fast` y `pnpm test:e2e`.
- [x] 2.7 Commit sugerido: `feat: agregar constructor de condiciones de ámbito e índices de apoyo`

## 3. Actas: lectura con ámbito, IDOR, nivel 4 y resolución de región (TDD)

Requisitos: spec `alcance-datos` (Actas limitadas al ámbito), `autenticacion-roles` (Staff y Admin Regional en `POST /api/actas`). Diseño: Decisiones 1, 2, 5; pasos de implementación 3.

- [x] 3.1 RED: agregar a `src/server/repositorios/__tests__/escuelas.repositorio.test.ts` pruebas de `resolverAmbitoDeEscuela(db, escuelaId)` (devuelve `{ escuelaId, regionId }` o `undefined` si no existe).
- [x] 3.2 GREEN: modificar `src/server/repositorios/escuelas.repositorio.ts` agregando `resolverAmbitoDeEscuela` sobre `obtenerEscuelaPorId`. (Adelantada a la sección 1 para cerrar el bypass del nivel 2 en los POST de actas y escaneos sin dejar la suite en rojo; se agregó `ambitoDeEscuelaObjetivo` en `src/server/auth/ambito.ts`.)
- [x] 3.3 RED: crear `src/server/servicios/__tests__/actas.servicio.test.ts` con repositorios simulados: `listarActas` y `obtenerActaPorId` propagan `ambito`; `agregarEstudiante`, `agregarFirmante` y `actualizarActa` lanzan `ErrorNoEncontrado` cuando la carga con ámbito devuelve `undefined`, sin llamar a insertar/actualizar ni al auditor; `listarEstudiantesDeActa` y `listarFirmantesDeActa` lanzan `ErrorNoEncontrado` para acta fuera de ámbito; la auditoría incluye `escuelaId` del acta.
- [x] 3.4 GREEN: modificar `src/server/repositorios/actas.repositorio.ts` (`listarActas` y `obtenerActaPorId` reciben `ambito` y combinan `and(condicionEscuelaEnAmbito(...), filtros)`) y `src/server/servicios/actas.servicio.ts` (ámbito obligatorio, carga con ámbito previa a las escrituras, `escuelaId` en la auditoría).
- [x] 3.5 RED: ampliar `src/app/api/actas/__tests__/route.test.ts` y crear `src/app/api/actas/[id]/__tests__/route.test.ts`, `src/app/api/actas/[id]/estudiantes/__tests__/route.test.ts` y `src/app/api/actas/[id]/firmantes/__tests__/route.test.ts` con los escenarios: nivel 3 lista solo su escuela; nivel 2 lista su región y consulta acta de su región (200) y de otra región (404); nivel 1 ve todo; `GET /api/actas?escuelaId=10` por nivel 3 de la escuela 5 → 200 vacío; `GET [id]` ajeno e inexistente → 404 con el mismo cuerpo; `GET` estudiantes/firmantes de acta ajena → 404; Staff `POST` estudiantes/firmantes en su escuela → 201; IDOR `POST` estudiantes/firmantes y `PATCH` acta ajena → 404 sin escritura ni auditoría; nivel insuficiente sigue en 403 antes que el ámbito; `POST /api/actas` de Admin Regional con escuela de otra región → 403 y sin acta creada; escuela inexistente → 403; Staff con su escuela → 201 y con otra → 403.
- [x] 3.6 GREEN: modificar `src/app/api/actas/route.ts` (GET con `derivarAmbitoConsulta`; POST resuelve la región con `resolverAmbitoDeEscuela` solo si `sesion.nivel === 2`, `403` si la escuela no existe), `src/app/api/actas/[id]/route.ts` (GET/PATCH con ámbito; `NotFoundError` → 404 con `{ error: "Acta no encontrada" }`), `src/app/api/actas/[id]/estudiantes/route.ts` y `src/app/api/actas/[id]/firmantes/route.ts` (GET/POST con ámbito; POST baja a `verificarRol(sesion, 4)`).
- [x] 3.7 Revisar pruebas existentes afectadas (p. ej. las de `src/app/api/actas/__tests__/route.test.ts`) y adaptarlas a la nueva firma con `ambito`.
- [x] 3.8 (Hecho: `responderErrorDeRecurso` en `src/server/http/respuestas.ts` y la fábrica `crearServicioActasDesdeDb` en `src/server/servicios/actas.fabrica.ts`, que elimina el armado del servicio copiado en 4 rutas y 5 pruebas e2e. La inclusión de `escuelaId` en la auditoría de actas queda para la tarea 9.8, cuando el `Auditor` acepte ese campo. Las pruebas de `[id]`, estudiantes y firmantes comparten `src/app/api/actas/[id]/__tests__/route.test.ts`.) REFACTOR: detectar patrón repetido de mapeo `NotFoundError` → 404 en las rutas y unificarlo si reduce duplicación sin abstracción gratuita; ejecutar `pnpm vitest run src/app/api/actas src/server` y `pnpm verify:fast`.
- [x] 3.9 E2E parcial: ejecutar `pnpm test:e2e -- actas` y restaurar el estado de la base si alguna prueba escribió; adaptar `test/e2e/actas.test.ts` si la nueva firma o los códigos lo exigen.
- [x] 3.10 Commit sugerido: `feat: limitar actas al ámbito, cerrar IDOR y permitir Staff en estudiantes y firmantes`

## 4. Graduaciones con ámbito (TDD)

Requisitos: spec `alcance-datos` (Graduaciones y su búsqueda limitadas al ámbito). Diseño: paso 4.

- [x] 4.1 RED: crear `src/server/servicios/__tests__/graduaciones.servicio.test.ts` (repositorio simulado: el servicio propaga `ambito` en búsqueda y por id) y `src/app/api/graduaciones/__tests__/route.test.ts` y `src/app/api/graduaciones/[id]/__tests__/route.test.ts` con los escenarios: nivel 3 no ve otras escuelas al buscar por identificación; búsqueda sin coincidencias dentro del ámbito → 200 vacío sin indicar registros externos; `GET [id]` de otra escuela → 404; nivel 2 solo su región.
- [x] 4.2 GREEN: modificar `src/server/repositorios/graduaciones.repositorio.ts` (`construirCondiciones` y `obtenerGraduacionPorId` agregan `condicionEscuelaEnAmbito(ambito, actas.escuelaId)`; total y paginación calculados con la misma condición), `src/server/servicios/graduaciones.servicio.ts` (propaga `ambito`), `src/app/api/graduaciones/route.ts` y `src/app/api/graduaciones/[id]/route.ts` (derivan y pasan `ambito`; 404 con el cuerpo actual).
- [x] 4.3 Revisar y adaptar pruebas existentes de graduaciones afectadas por el parámetro nuevo (incluida `test/e2e/graduaciones.test.ts`).
- [x] 4.4 Ejecutar `pnpm vitest run graduaciones`, `pnpm verify:fast` y `pnpm test:e2e -- graduaciones`; restaurar el estado de la base.
- [x] 4.5 Commit sugerido: `feat: limitar la búsqueda y consulta de graduaciones al ámbito del actor`

## 5. Escaneos con ámbito y DELETE 404 (TDD)

Requisitos: spec `alcance-datos` (Escaneos limitados al ámbito y sin URL firmada fuera del ámbito), `autenticacion-roles` (POST de escaneos). Diseño: Decisión 5; paso 5.

- [x] 5.1 RED: actualizar `src/app/api/escaneos/[id]/__tests__/route.test.ts`: cambiar la prueba existente "retorna 403 si Admin Escuela intenta eliminar un escaneo de otra escuela" para que espere `404` (sin eliminar el escaneo ni su objeto en R2) y agregar los casos de `GET [id]` fuera de ámbito → 404 sin URL firmada, dentro de ámbito → 200 con URL firmada, y nivel 2 de otra región → 404.
- [x] 5.2 RED: ampliar `src/server/servicios/__tests__/escaneos.servicio.test.ts` (el servicio propaga `ambito`; la URL firmada no se genera si el escaneo no se obtuvo; `eliminarEscaneo` lanza `ErrorNoEncontrado` sin borrar en R2 ni auditar; la auditoría incluye `escuelaId`) y `src/app/api/escaneos/__tests__/route.test.ts` (nivel 4 lista solo su escuela; `POST` de nivel 2 con escuela de otra región → 403; Staff con su escuela → autorizado y con otra → 403).
- [x] 5.3 GREEN: modificar `src/server/repositorios/escaneos.repositorio.ts` (`listarEscaneos` y `obtenerEscaneoPorId` con `ambito`), `src/server/servicios/escaneos.servicio.ts` (lecturas y URL firmada solo tras la carga con ámbito; `eliminarEscaneo` verifica ámbito; `escuelaId` en auditoría), `src/app/api/escaneos/route.ts` (GET con ámbito; POST resuelve región para nivel 2) y `src/app/api/escaneos/[id]/route.ts` (GET/DELETE con ámbito → 404; el DELETE deja de usar `verificarRol` para el ámbito).
- [x] 5.4 Ejecutar `pnpm vitest run src/app/api/escaneos src/server/servicios/__tests__/escaneos.servicio.test.ts`, `pnpm verify:fast` y `pnpm test:e2e -- escaneos`; restaurar el estado de la base.
- [x] 5.5 Commit sugerido: `feat: limitar escaneos al ámbito y responder 404 al eliminar un escaneo ajeno`

## 6. Personas: consulta exacta, alta por Staff y corrección de la interfaz (TDD)

Requisitos: spec `alcance-datos` (Consulta de persona por identificación exacta con datos mínimos; Registro de personas por Staff). Diseño: Decisión 8, D1 y D7; paso 6.

- [x] 6.1 RED: crear `src/server/repositorios/__tests__/personas.repositorio.test.ts` (contra SQLite real o base de prueba) para `obtenerPersonaMinimaPorIdentificacion`: devuelve solo `id`, `nombres`, `apellidos` e `identificacion`; devuelve `undefined` sin coincidencia exacta; una identificación parcial no coincide.
- [x] 6.2 RED: crear `src/server/servicios/__tests__/personas.servicio.test.ts` para `buscarPersonaPorIdentificacionExacta` (proyección mínima, sin `ambito`) y para la creación (duplicado → error que el handler mapea a 400, sin duplicado ni auditoría; creación auditada).
- [x] 6.3 RED: crear `src/app/api/personas/__tests__/route.test.ts` con los escenarios: `GET ?identificacion=` devuelve una lista de un elemento con solo campos mínimos; sin coincidencia → 200 `[]`; persona fuera de ámbito encontrada por identificación exacta con solo campos mínimos; identificación parcial → 200 `[]`; sin sesión → 401; si llegan `identificacion` y `busqueda`, prevalece `identificacion`; `POST` de Staff (nivel 4) → 201 y auditoría de creación; `POST` con identificación duplicada → 400 sin auditoría; `POST` sin sesión → 401.
- [x] 6.4 GREEN: modificar `src/server/repositorios/personas.repositorio.ts` (nueva `obtenerPersonaMinimaPorIdentificacion` con columnas explícitas y el tipo `PersonaMinima`), `src/server/servicios/personas.servicio.ts` (`buscarPersonaPorIdentificacionExacta`) y `src/app/api/personas/route.ts` (GET: modo `identificacion` exacta solo con verificación de sesión; POST baja a `verificarRol(sesion, 4)`).
- [x] 6.5 (Desviación: la lógica duplicada en ambas páginas se extrajo a `resolverPersonaPorIdentificacion` en `src/lib/personas.ts`, probada en `src/lib/__tests__/personas.test.ts`, en lugar de dos pruebas de página.) RED (interfaz): crear `src/app/actas/nueva/__tests__/page.test.tsx` y `src/app/actas/[id]/__tests__/page.test.tsx` (patrón de `src/app/usuarios/__tests__/page.test.tsx`) que verifiquen que la interfaz vincula solo a la persona cuya `identificacion` coincide exactamente con la ingresada, nunca al primer elemento de la lista, y que ante una lista vacía crea la persona.
- [x] 6.6 GREEN: modificar `src/app/actas/nueva/page.tsx` y `src/app/actas/[id]/page.tsx` para usar el resultado solo si su `identificacion` coincide exactamente y, si la lista es vacía, crear la persona (corrección del defecto de `personas[0]`).
- [x] 6.7 Ejecutar `pnpm vitest run personas src/app/actas`, `pnpm verify:fast` y `pnpm test:e2e -- personas`; restaurar el estado de la base.
- [x] 6.8 Commit sugerido: `fix: consultar persona por identificación exacta con datos mínimos y permitir su alta al Staff`

## 7. Personas y funcionarios con ámbito y PATCH con ámbito (TDD)

Requisitos: spec `alcance-datos` (Personas y funcionarios limitados al ámbito). Diseño: Decisión 3, D2 y D6; paso 7.

- [x] 7.1 RED: ampliar `src/server/repositorios/__tests__/personas.repositorio.test.ts` y crear `src/server/repositorios/__tests__/funcionarios.repositorio.test.ts` (SQLite real) para `listarPersonas`/`obtenerPersonaPorId` (persona en ámbito por estudiante, por firmante o por asignación como funcionario; sin vínculo → solo nivel 1) y `listarFuncionarios`/`obtenerFuncionarioPorId` (`EXISTS` sobre `funcionario_escuela`, sin duplicados para funcionarios multi-escuela, filtro `escuelaId` del cliente que solo estrecha).
- [x] 7.2 RED: crear `src/server/servicios/__tests__/funcionarios.servicio.test.ts` y ampliar `src/server/servicios/__tests__/personas.servicio.test.ts` (propagan `ambito`; `actualizarPersona` y `actualizarFuncionario` lanzan `ErrorNoEncontrado` sin escritura ni auditoría; la auditoría de `funcionario_escuela` incluye `escuelaId`).
- [x] 7.3 RED: crear `src/app/api/personas/[id]/__tests__/route.test.ts`, `src/app/api/funcionarios/__tests__/route.test.ts` y `src/app/api/funcionarios/[id]/__tests__/route.test.ts` con los escenarios de la spec: persona en ámbito por acta y por asignación → 200; Staff no ve persona sin vínculo (404 y ausente del listado); persona y funcionario sin vínculo → 404 para nivel 2 y 200 para nivel 1; `busqueda=Mora` excluye personas ajenas; IDOR `PATCH` persona y funcionario fuera de ámbito → 404 sin cambios ni auditoría; nivel 3 lista solo funcionarios de su escuela; funcionario de otra región → 404; nivel 1 ve todo.
- [x] 7.4 GREEN: modificar `src/server/repositorios/personas.repositorio.ts` (`listarPersonas` y `obtenerPersonaPorId` con `or(exists(estudiante), exists(firmante), exists(asignación))` y `condicionEscuelaEnAmbito`), `src/server/repositorios/funcionarios.repositorio.ts` (`EXISTS` en lugar de `innerJoin`), los servicios `personas.servicio.ts` y `funcionarios.servicio.ts` (propagan `ambito`; `PATCH` con carga previa con ámbito) y las rutas `src/app/api/personas/[id]/route.ts`, `src/app/api/funcionarios/route.ts` y `src/app/api/funcionarios/[id]/route.ts` (GET con ámbito, `PATCH` con `NotFoundError` → 404 con el cuerpo actual del recurso).
- [x] 7.5 REFACTOR: unificar la subconsulta de vínculo por escuela repetida entre personas, funcionarios y usuarios solo si reduce duplicación evidente; ejecutar `pnpm vitest run personas funcionarios` y `pnpm verify:fast`.
- [x] 7.6 Ejecutar `pnpm test:e2e -- personas funcionarios` y restaurar el estado de la base.
- [x] 7.7 Commit sugerido: `feat: limitar personas y funcionarios al ámbito y cerrar IDOR en sus PATCH`

## 8. Usuarios con ámbito y unificación de la regla (TDD)

Requisitos: spec `gestion-usuarios` (ámbito en lectura, restablecer y cambiar estado, mapeo 403/404) y `alcance-datos` (Usuarios limitados al ámbito en lectura). Diseño: Decisión 7 y D5; paso 8.

- [ ] 8.1 RED: ampliar `src/server/servicios/__tests__/usuarios.servicio.test.ts`: `listar(ambito)` y `obtenerPorId(id, ambito)` propagan el ámbito; `restablecerContrasena` y `cambiarEstado` lanzan `ErrorNoEncontrado` cuando el destino está fuera de ámbito (evaluado primero) y `ErrorProhibido` cuando está dentro con rol más privilegiado; `crear` con funcionario fuera de ámbito sigue lanzando error de autorización (403); sin escritura ni auditoría en los rechazos; nivel 4 sigue sin acceso.
- [ ] 8.2 RED: ampliar `src/server/repositorios/__tests__/usuarios.repositorio.test.ts` (`listarUsuarios` y `obtenerUsuarioEnAmbitoPorId` con `EXISTS` sobre el funcionario) y `src/app/api/usuarios/__tests__/route.test.ts` y `src/app/api/usuarios/[id]/__tests__/route.test.ts` (nivel 3 lista solo su escuela; nivel 2 solo su región; nivel 1 ve todo; `GET [id]` fuera de ámbito → 404; restablecer/cambiar estado fuera de ámbito → 404 con el mismo cuerpo que un usuario inexistente; jerarquía dentro del ámbito → 403; crear Admin País por Admin Regional → 403).
- [ ] 8.3 GREEN: modificar `src/server/repositorios/usuarios.repositorio.ts`, `src/server/servicios/usuarios.servicio.ts` (reemplaza `dentroDeAmbito` por `escuelasDentroDeAmbito` de `src/server/auth/ambito.ts`) y las rutas `src/app/api/usuarios/route.ts` y `src/app/api/usuarios/[id]/route.ts` (GET con ámbito; `NotFoundError` → 404, `ForbiddenError` → 403).
- [ ] 8.4 Ejecutar `pnpm vitest run usuarios`, `pnpm verify:fast` y `pnpm test:e2e -- usuarios conformidad-brd-usuarios`; restaurar el estado de la base.
- [ ] 8.5 Commit sugerido: `feat: limitar usuarios al ámbito y distinguir 404 de 403 en operaciones por id`

## 9. Auditoría con ámbito: columnas y lectura (TDD)

Requisitos: spec `auditoria` (registro con `escuela_id`/`region_id`, lectura por ámbito niveles 1–4). Diseño: Decisión 4, D3; paso 9.

- [ ] 9.1 RED: ampliar `src/db/__tests__/esquema.test.ts` con `auditoria.escuela_id` y `auditoria.region_id` (nullable, con referencias) y con los índices `idx_auditoria_escuela_id` e `idx_auditoria_region_id`.
- [ ] 9.2 GREEN: modificar `src/db/esquema.ts` agregando ambas columnas nullable con sus referencias y los dos índices; regenerar la migración inicial única (`drizzle/0000_*.sql`) y recrear las bases locales y de prueba.
- [x] 9.3 ~~Prueba del relleno histórico~~ — eliminada: la base no se ha publicado y no hay filas previas (decisión 2026-09-29).
- [x] 9.4 ~~SQL de relleno idempotente~~ — eliminada por la misma decisión.
- [ ] 9.5 RED: ampliar `src/server/repositorios/__tests__/auditoria.repositorio.test.ts` y `src/server/servicios/__tests__/auditoria.servicio.test.ts`: la inserción guarda `escuelaId` y `regionId`; el `Auditor` deriva `regionId` desde `escuelaId` con `resolverAmbitoDeEscuela` cuando falta; recurso regional sin escuela (`regiones` actualizar/desactivar) → `escuelaId` `NULL` y `regionId` de la región; recursos nacionales (creación de región, `tipos_acta`, `personas`, `funcionarios`) → ambos `NULL`; `listarAuditoria(ambito)` (`pais` sin filtro, `region` por `region_id`, `escuela` por `escuela_id`, `ninguno` vacío).
- [ ] 9.6 RED: crear `src/app/api/auditoria/__tests__/route.test.ts` con los escenarios de la spec: nivel 4 → 200 filtrado por su escuela; nivel 3 no ve registros regionales sin escuela; nivel 2 ve su región incluidos los registros regionales sin escuela; nivel 1 ve todo; registros nacionales solo nivel 1; sin sesión → 401.
- [ ] 9.7 GREEN: modificar `src/server/repositorios/auditoria.repositorio.ts` (inserta `escuelaId`/`regionId`; `listarAuditoria` recibe `ambito`), `src/server/servicios/auditoria.servicio.ts` (`Auditor` con `escuelaId?`/`regionId?` y derivación de la región), `src/server/servicios/auditoria.vistas.servicio.ts` (propaga `ambito`) y `src/app/api/auditoria/route.ts` (`verificarRol(sesion, 4)` y pasa `ambito`).
- [ ] 9.8 GREEN: pasar `escuelaId` o `regionId` al auditor en todos los servicios según la tabla de origen de la Decisión 4: `src/server/servicios/escuelas.servicio.ts` (escuela y región de la escuela), `src/server/servicios/regiones.servicio.ts` (`regionId` en actualizar/desactivar; crear queda nacional), y verificar que `actas.servicio.ts`, `escaneos.servicio.ts`, `funcionarios.servicio.ts` y `usuarios.servicio.ts` ya lo informan (`usuarios`: primera escuela del funcionario destino con `obtenerAmbitoDeFuncionario(...).escuelaIds[0]`).
- [ ] 9.9 Aplicar la migración con `pnpm db:init-local`, ejecutar `pnpm vitest run auditoria regiones escuelas`, `pnpm verify:fast` y `pnpm test:e2e -- auditoria`; restaurar el estado de la base.
- [ ] 9.10 Commit sugerido: `feat: registrar escuela y región en la auditoría y limitar su consulta al ámbito`

## 10. E2E de conformidad de ámbito contra SQLite real (TDD)

Requisitos: todas las specs del cambio. Diseño: estrategia de pruebas (capa E2E). Esta es la verificación de referencia de las condiciones SQL.

- [ ] 10.1 RED: crear `test/e2e/alcance-datos.test.ts` (patrón de `test/e2e/conformidad-brd-usuarios.test.ts` y `test/e2e/helpers.ts`) con el escenario base: dos regiones y tres escuelas (dos en la región propia), con datos en cada una (actas, escaneos, graduaciones, personas por vínculo de acta y de asignación, funcionarios multi-escuela, usuarios, filas de auditoría).
- [ ] 10.2 Cubrir por cada nivel (1 a 4): listados y `[id]` de actas, escaneos, graduaciones (con total y paginación), personas, funcionarios y usuarios; identificación exacta fuera de ámbito con solo campos mínimos; funcionarios multi-escuela sin duplicados; filtro `escuelaId` ajeno → resultado vacío; sesiones inconsistentes (`ninguno`) → vacío y 404.
- [ ] 10.3 Cubrir auditoría: fila regional visible para nivel 2 y no para nivel 3; filas nacionales solo nivel 1; `escuela_id` y `region_id` poblados al escribir.
- [ ] 10.4 GREEN: corregir cualquier condición de ámbito que la prueba exponga (subconsulta regional, `EXISTS`); no debilitar las aserciones.
- [ ] 10.5 Restaurar el estado de la base al terminar (limpieza de `temp-e2e.db`/datos creados) y ejecutar `pnpm test:e2e` completo en verde.
- [ ] 10.6 Commit sugerido: `test: agregar prueba e2e de conformidad de ámbito por escuela y región`

## 11. Documentación técnica (OBLIGATORIO)

- [ ] 11.1 Actualizar `docs/api-spec.yml`: respuestas `404` por ámbito en las rutas `[id]` y en las escrituras IDOR; `GET /api/personas?identificacion=` como consulta exacta con `PersonaMinima`; `GET /api/auditoria` para niveles 1–4; nivel mínimo 4 en `POST /api/actas/[id]/estudiantes`, `POST /api/actas/[id]/firmantes` y `POST /api/personas`; `DELETE /api/escaneos/[id]` fuera de ámbito → 404.
- [ ] 11.2 Actualizar `docs/data-model.md`: corregir las notas de control de acceso de las líneas ~76 y ~118 que hoy eximen al nivel 2; agregar las columnas `auditoria.escuela_id` y `auditoria.region_id` y la lista de índices nuevos.
- [ ] 11.3 Actualizar `docs/brd.md` §6 (Staff: consulta y registro de actas, estudiantes, firmantes y personas dentro de su escuela) y §7.5 (el Staff y el Admin Regional también consultan la auditoría de su ámbito; se desvía del texto "admins inferiores").
- [ ] 11.4 Actualizar `docs/backend-standards.md` si el patrón de `AmbitoConsulta`/`404` por ámbito debe quedar como estándar (si no aplica, dejar constancia en el commit).
- [ ] 11.5 Regenerar o actualizar el diagrama `docs/arquitectura/alcance-escuela-region/alcance-escuela-region.json` (fuente de archify) y su `.html`: el diagrama es anterior a las decisiones D3–D7 (Staff en auditoría; Staff registrando estudiantes, firmantes y personas) y debe reflejarlas tras la implementación.
- [ ] 11.6 Revisar el idioma (español, Costa Rica), eliminar comentarios redundantes en el código tocado por el cambio y confirmar que `openspec/changes/seguridad-alcance-escuela-region/tasks.md` refleja el estado real.
- [ ] 11.7 Commit sugerido: `docs: actualizar API, modelo de datos, BRD y diagrama por la seguridad de ámbito`

## 12. Verificación final (OBLIGATORIO)

- [ ] 12.1 Ejecutar `pnpm verify` (lint + typecheck + `pnpm test` + `pnpm test:e2e`) y dejar todo en verde; el agente lo ejecuta, no el usuario.
- [ ] 12.2 Ejecutar `pnpm build` para confirmar que las rutas y páginas compilan (equivale a `verify:ci` sin el modo detallado).
- [ ] 12.3 Verificación manual acotada del flujo de alta de estudiante con `pnpm dev:local:demo`: buscar por identificación exacta, vincular a persona existente de otra escuela (datos mínimos) y crear persona nueva; limpiar la base local y restaurar el estado.
- [ ] 12.4 Verificar la matriz de escenarios de las cuatro specs (`alcance-datos`, `autenticacion-roles`, `gestion-usuarios`, `auditoria`) contra las pruebas escritas y anotar cualquier escenario sin cobertura.
- [ ] 12.5 Confirmar que la prueba "retorna 403 si Admin Escuela intenta eliminar un escaneo de otra escuela" ahora espera `404` y que no quedan referencias al `403` por ámbito en `DELETE /api/escaneos/[id]`.
- [ ] 12.6 Preparar la transición a `/gentle-sdd-verify` y, después, `/gentle-sdd-archive`; ante cambios posteriores a apply, actualizar primero specs y este `tasks.md` (CLAUDE.md §5).
