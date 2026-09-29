# Diseño: Seguridad por ámbito de escuela y región

## Enfoque técnico

El ámbito de datos se deriva **una sola vez por petición** a partir de la sesión (`SesionUsuario`) y se representa con un valor tipado, `AmbitoConsulta`. El route handler lo deriva y lo pasa explícitamente al servicio, que lo pasa al repositorio. El repositorio lo traduce a condiciones de Drizzle (`where` / `exists` / subconsultas) **dentro de la misma consulta** que obtiene los datos. Así:

- Los listados excluyen registros fuera del ámbito en SQL, por lo que `total` y paginación reflejan solo lo visible (spec `alcance-datos`, "Los listados excluyen sin error").
- Las consultas por `[id]` devuelven `undefined` cuando el recurso no existe **o** está fuera del ámbito; ambos casos siguen el mismo camino de código y producen el mismo `404` con el mismo cuerpo, por construcción (spec "Recurso fuera de ámbito y recurso inexistente son indistinguibles").
- Los filtros del cliente (`escuelaId`, `regionId`, etc.) se combinan con `and(...)` junto con la condición de ámbito: solo pueden estrechar el resultado (spec "Un filtro por escuela ajena no amplía el ámbito").
- Las escrituras sobre recursos existentes (IDOR) cargan primero el recurso **con** ámbito; si no se obtiene, lanzan `ErrorNoEncontrado` antes de escribir o auditar. Esto aplica a actas (estudiantes, firmantes, `PATCH`), escaneos (`DELETE`), personas y funcionarios (`PATCH`) y usuarios (restablecer contraseña, cambiar estado).

La autorización contra una `escuelaId` enviada en el cuerpo (`POST /api/actas`, `POST /api/escaneos`) sigue usando `verificarRol`, pero ahora un Admin Regional se valida contra la **región de la escuela objetivo**, que el handler resuelve con el repositorio de escuelas (spec `autenticacion-roles`).

La única excepción deliberada al ámbito es la consulta de persona por **identificación exacta**, que devuelve solo datos mínimos (Decisión 8).

Para la auditoría se agregan las columnas `escuela_id` y `region_id` (nullable) pobladas al escribir, dentro de la migración inicial única (Decisión 4).

## Decisiones de producto tomadas

| # | Decisión | Justificación |
|---|---|---|
| D1 | `GET /api/personas?identificacion=<exacta>` devuelve a cualquier usuario autenticado, sin ámbito, solo `id`, nombres, apellidos e `identificacion`; la búsqueda parcial (`busqueda`) sigue con ámbito. | La persona es única a nivel nacional; el ámbito estricto impediría vincular a estudiantes trasladados y generaría duplicados. Corrige además el defecto por el que `identificacion` se ignoraba. |
| D2 | Persona en ámbito si aparece en un acta (estudiante o firmante) de una escuela del ámbito **o** si es funcionario asignado (`funcionario_escuela`) a una escuela del ámbito; funcionario en ámbito por sus escuelas asignadas; sin vínculo → solo nivel 1. | Refleja los vínculos reales de la persona con la escuela sin desnormalizar; los no vinculados siguen siendo localizables por D1. |
| D3 | Auditoría guarda `escuela_id` y `region_id` (nullable); nivel 1 ve todo, nivel 2 toda su región (incluidos registros regionales sin escuela), niveles 3 y 4 solo su escuela, registros nacionales solo nivel 1. `GET /api/auditoria` baja a nivel mínimo 4. | Permite al Admin Regional ver la auditoría de su propia región y al Staff la de su escuela. Se desvía del BRD §7.5 ("admins inferiores"): el BRD se actualizará como tarea del cambio. |
| D4 | `POST /api/actas/[id]/estudiantes` y `POST /api/actas/[id]/firmantes` bajan a nivel 4, con verificación de ámbito del acta (`404`). | Coherencia con el cambio previo que permite al Staff registrar actas; BRD §6 "consulta y registro dentro de su escuela". |
| D5 | En usuarios `[id]` (restablecer contraseña, cambiar estado), destino fuera de ámbito → `404`; destino dentro del ámbito con rol más privilegiado → `403`. | Coherencia con las demás rutas `[id]` (no revelar existencia); la violación de jerarquía no revela nada nuevo. |
| D6 | `PATCH /api/personas/[id]` y `PATCH /api/funcionarios/[id]` verifican el ámbito del recurso (`404`). | Cierra dos IDOR que quedaban fuera en la versión anterior del diseño. |
| D7 | `POST /api/personas` baja de nivel 2 a nivel 4 (Staff); duplicado de identificación mantiene el `400` actual; toda creación se audita. | Sin esto, Staff y Admin Escuela vinculan estudiantes existentes pero no registran nuevos, y la decisión de que el Staff registre actas queda incompleta; la identificación única evita duplicados. |

Fuera de alcance: la ruta de API para asignar un funcionario a una escuela (hoy `asignarFuncionarioAEscuela` solo existe en el servicio). Hasta que exista, un funcionario creado por API solo entra en el ámbito de los niveles 2–4 si se asigna por otra vía.

## Decisiones de arquitectura

### Decisión 1: El filtro de ámbito vive en el repositorio como condición SQL derivada de un tipo `AmbitoConsulta`

**Elección**: Tipo discriminado `AmbitoConsulta` derivado por una única función pura `derivarAmbitoConsulta(sesion)` en `src/server/auth/ambito.ts`. El route handler lo calcula; servicio y repositorio lo reciben como parámetro obligatorio (no opcional) en todas las operaciones de lectura con ámbito. Un único constructor de condiciones, `condicionEscuelaEnAmbito(ambito, columnaEscuelaId)`, en `src/server/repositorios/ambito.condiciones.ts`, traduce el ámbito a SQL:

| `tipo` | Condición generada |
|---|---|
| `pais` | `undefined` (sin restricción) |
| `region` | `columna IN (SELECT id FROM escuelas WHERE region_id = ?)` |
| `escuela` | `columna = ?` |
| `ninguno` | `sql\`0 = 1\`` (resultado vacío) |

**Alternativas consideradas**:
- *Post-filtrado en memoria en el servicio*: rechazado. Rompe `total`/paginación de graduaciones, trae datos personales fuera del ámbito a memoria (contrario a Ley 8968 y a "privacidad por defecto") y no escala.
- *Pasar `SesionUsuario` al repositorio*: rechazado. Acopla la capa de datos a la forma de la sesión y dispersa la regla nivel→ámbito por cada repositorio.
- *Parámetro de ámbito opcional*: rechazado. Un olvido silencioso equivaldría a "sin restricción". Al hacerlo obligatorio, TypeScript obliga a cada llamador a decidir.

**Justificación**: la regla de negocio (nivel → ámbito) queda en un solo lugar puro y fácil de probar; la traducción a SQL queda en un solo lugar de la capa de datos; y el filtro se aplica donde está el dato, respetando la arquitectura por capas de `docs/backend-standards.md` §2 (el route handler no toca la base).

La variante `ninguno` cubre sesiones inconsistentes (nivel 2 sin `regionId`, nivel 3–4 sin `escuelaId`, p. ej. un funcionario sin escuela asignada): se **falla cerrado** con resultados vacíos y `404`, en lugar de caer en "sin restricción".

### Decisión 2: Resolución escuela→región para escrituras con `escuelaId` en el cuerpo; `verificarRol` cambia sin romper llamadores

**Elección**:
- `AmbitoVerificacion` mantiene su forma `{ escuelaId?, regionId? }`, pero la semántica queda definida así: cuando se pasa `escuelaId`, `regionId` **es la región de esa escuela** (resuelta por el llamador en el servidor, nunca tomada del cliente).
- Nueva regla de `verificarRol` cuando hay `ambito`:
  - nivel 1 → autorizado.
  - `regionId` presente y distinto de `sesion.regionId` → `403` (igual que hoy; conserva a `escuelas.servicio.ts`, que pasa solo `regionId`).
  - nivel 2 con `escuelaId` presente y `regionId` ausente → `403` (**falla cerrado**: impide reintroducir el bypass si un llamador olvida resolver la región).
  - nivel 3–4 con `escuelaId` distinto de `sesion.escuelaId` → `403` (igual que hoy).
- Nueva función asíncrona `resolverAmbitoDeEscuela(escuelaId)` expuesta por el repositorio de escuelas (reutiliza `obtenerEscuelaPorId`) que devuelve `{ escuelaId, regionId } | undefined`. Los handlers de `POST /api/actas` y `POST /api/escaneos` la invocan **solo cuando `sesion.nivel === 2`** (para nivel 1 no hace falta; para 3–4 basta la comparación de escuela). Si la escuela no existe, se responde `403` (misma respuesta que una escuela ajena, sin revelar existencia).
- Sin caché. Es una lectura por clave primaria sobre una tabla pequeña, una vez por escritura; un caché entre peticiones en funciones serverless de Vercel no es fiable y agregaría riesgo de datos obsoletos si una escuela cambia de región.

**Alternativas consideradas**:
- *Hacer `verificarRol` asíncrono y que resuelva la región internamente*: rechazado. Obliga a inyectar un repositorio en una función hoy pura y síncrona, usada por 20+ llamadores y 23 pruebas.
- *Incluir en el JWT la lista de escuelas de la región*: rechazado. El JWT queda obsoleto al crear escuelas y la revalidación del JWT está fuera de alcance.

**Justificación**: los llamadores existentes que pasan solo `regionId` (`escuelas.servicio.ts`) o que no pasan ámbito conservan su comportamiento; los tres llamadores con `escuelaId` (`actas/route.ts` POST, `escaneos/route.ts` POST, `escaneos/[id]/route.ts` DELETE) se ajustan en este cambio (el DELETE deja de usar `verificarRol` para el ámbito y pasa a la carga con ámbito de la Decisión 5).

### Decisión 3: Ámbito de personas por vínculo con actas o asignación como funcionario, y de funcionarios por `funcionario_escuela`, con `EXISTS`

**Elección** (decisión de producto D2):
- **Persona** en ámbito si existe al menos uno de estos vínculos:
  1. como estudiante en un acta en ámbito: `personas.id = estudiantes.persona_id` → `acta_estudiantes.estudiante_id` → `actas.escuela_id`;
  2. como firmante de un acta en ámbito: `personas.id = funcionarios.persona_id` → `acta_firmantes.funcionario_id` → `actas.escuela_id`;
  3. como funcionario asignado a una escuela en ámbito: `personas.id = funcionarios.persona_id` → `funcionario_escuela.escuela_id`.
  Se implementa como `or(exists(subconsultaEstudiante), exists(subconsultaFirmante), exists(subconsultaAsignacion))`; cada subconsulta usa `condicionEscuelaEnAmbito(ambito, <columna escuela>)`.
- **Funcionario** en ámbito si existe una fila de `funcionario_escuela` con `escuela_id` en ámbito: `exists(select 1 from funcionario_escuela where funcionario_id = funcionarios.id and <condición>)`. El filtro `escuelaId` del cliente se agrega como condición adicional dentro del mismo `EXISTS`.
- **Usuario** en ámbito si su funcionario está en ámbito (misma subconsulta sobre `usuarios.funcionario_id`).
- Personas y funcionarios sin ningún vínculo quedan visibles solo para el nivel 1 (para `pais` la condición es `undefined`); siguen siendo localizables por identificación exacta (Decisión 8).
- `PATCH /api/personas/[id]` y `PATCH /api/funcionarios/[id]` cargan el recurso con la misma condición antes de actualizar; si no se obtiene → `ErrorNoEncontrado` → `404`, sin escritura ni auditoría (D6).

**Alternativas consideradas**:
- *`innerJoin` como hoy en `listarFuncionarios`*: rechazado. Con funcionarios de varias escuelas duplica filas; `EXISTS` no duplica y es igual de indexable.
- *Tabla/columna desnormalizada `persona.escuela_id`*: rechazado. Una persona puede tener registros en varias escuelas; la relación es N:M por naturaleza.

**Justificación**: factible con el esquema actual (`acta_estudiantes → estudiantes → personas`, `acta_firmantes → funcionarios → personas` y `funcionario_escuela → funcionarios → personas`).

### Decisión 4: Auditoría con columnas `escuela_id` y `region_id` pobladas al escribir

**Elección** (decisión de producto D3):
- Esquema: columnas nullable `auditoria.escuela_id` (referencia a `escuelas`) y `auditoria.region_id` (referencia a `regiones`) + índices `idx_auditoria_escuela_id` e `idx_auditoria_region_id`, incluidas en la migración inicial única regenerada.
- `Auditor` acepta `escuelaId?: number | null` y `regionId?: number | null`. Cuando se informa `escuelaId` sin `regionId`, el servicio de auditoría resuelve la región de esa escuela (`resolverAmbitoDeEscuela`) antes de insertar, de modo que ambos valores siempre son coherentes; cada servicio no necesita conocer la región. Origen por tabla:

| `tabla` auditada | `escuela_id` | `region_id` |
|---|---|---|
| `actas` | `datos.escuelaId` / acta cargada con ámbito | derivada de la escuela |
| `acta_estudiantes`, `acta_firmantes` | `acta.escuelaId` (el acta ya se carga para verificar ámbito) | derivada de la escuela |
| `escaneos` | `escaneo.escuelaId` (también al eliminar) | derivada de la escuela |
| `escuelas` | id de la escuela | región de la escuela (valor nuevo en una actualización) |
| `funcionario_escuela` | `escuelaId` de la asignación | derivada de la escuela |
| `usuarios` | primera escuela del funcionario destino (`obtenerAmbitoDeFuncionario(...).escuelaIds[0]`), coherente con la limitación conocida de la sesión | derivada de la escuela |
| `regiones` (actualizar, desactivar) | `null` | id de la región |
| `regiones` (crear), `tipos_acta`, `personas`, `funcionarios` | `null` | `null` (nacional; solo nivel 1) |

- Sin relleno histórico (decisión 2026-09-29): la base no se ha publicado y no hay filas previas.
- Lectura, en `listarAuditoria(ambito)`:
  - `pais` → sin filtro.
  - `region` → `auditoria.region_id = ?` (incluye filas regionales sin escuela).
  - `escuela` → `auditoria.escuela_id = ?` (excluye filas regionales sin escuela).
  - `ninguno` → vacío.
  Una fila con ambas columnas `NULL` no cumple ninguna condición, por lo que solo la ve el nivel 1. El handler cambia `verificarRol(sesion, 1)` por `verificarRol(sesion, 4)`.

**Alternativas consideradas**:
- *Solo `escuela_id` y región por unión con `escuelas`*: rechazado tras D3. No permite registros regionales sin escuela (p. ej. la actualización de la propia región) y exige la subconsulta regional en cada lectura.
- *Resolver el ámbito en lectura uniendo por `tabla` + `registro_id`*: sin migración, pero exige un `CASE`/`UNION` por cada tabla auditada, acopla el repositorio de auditoría a todo el esquema, falla con registros eliminados (escaneos) y con `registro_id = 0`, y cada tabla nueva requiere tocar la consulta. Frágil y lento.
- *Filtrar por el ámbito del usuario que actuó*: rechazado. Contradice la spec ("según la escuela del recurso auditado"): una acción de un Admin País sobre la escuela 5 no la vería el Admin Escuela de la 5, y un Admin Regional que actuó fuera de su región aparecería en su ámbito.

**Justificación**: escuela y región son datos conocidos y baratos en el momento de escribir, inmutables como la propia fila de auditoría; la región queda congelada al momento del evento aunque la escuela cambie de región después. La consulta de lectura queda simple, sin subconsultas e indexada.

### Decisión 5: Error tipado `ErrorNoEncontrado` compatible con el mapeo existente

**Elección**: nuevo módulo `src/server/errores.ts` con clases `ErrorNoEncontrado` (`name = "NotFoundError"`) y `ErrorProhibido` (`name = "ForbiddenError"`). Se conserva el `name` en inglés porque todos los route handlers actuales comparan `error.name === "NotFoundError"` / `"ForbiddenError"`; así las clases nuevas son compatibles con los `catch` existentes sin tocarlos, y los servicios que hoy construyen `new Error()` y asignan `name` pueden migrarse gradualmente.

- Servicios con `obtenerPorId` que hoy devuelven `undefined` (escaneos, personas, funcionarios): se mantiene `undefined` → el handler ya responde `404`. No se cambia su contrato para acotar el diff.
- Servicios de escritura IDOR (`agregarEstudiante`, `agregarFirmante`, `actualizarActa`, `eliminarEscaneo`, `actualizarPersona`, `actualizarFuncionario`, `restablecerContrasena`, `cambiarEstado`): lanzan `ErrorNoEncontrado` antes de cualquier escritura o auditoría; el handler lo mapea a `404` con el **mismo cuerpo** que usa el `GET [id]` del recurso (`{ error: "Acta no encontrada" }`, `{ error: "Escaneo no encontrado" }`, etc.).
- `DELETE /api/escaneos/[id]` fuera de ámbito pasa de `403` a `404`: la prueba existente "retorna 403 si Admin Escuela intenta eliminar un escaneo de otra escuela" (`src/app/api/escaneos/[id]/__tests__/route.test.ts`) debe cambiar a `404`.
- Orden en el handler (backend-standards §4): sesión (`401`) → nivel (`403`) → ámbito del recurso (`404`) → jerarquía sobre el destino, solo en usuarios (`403`). Un nivel insuficiente sigue siendo `403` aunque el recurso sea ajeno.

**Alternativas consideradas**: formato `{ error: { codigo, mensaje } }` de backend-standards §4. Rechazado en este cambio: ningún endpoint lo usa hoy; migrarlo es un cambio transversal fuera de alcance. Se sigue el patrón real `{ error: string }`.

### Decisión 6: Índices

Ya existen `idx_actas_escuela_id`, `idx_escaneos_escuela_id` e `idx_personas_identificacion`. Se agregan, en una migración aditiva generada con `drizzle-kit generate`:

| Índice | Uso |
|---|---|
| `idx_escuelas_region_id` (`escuelas.region_id`) | subconsulta de ámbito regional |
| `idx_funcionario_escuela_funcionario_id`, `idx_funcionario_escuela_escuela_id` | ámbito de funcionarios, usuarios y personas asignadas |
| `idx_acta_estudiantes_acta_id`, `idx_acta_estudiantes_estudiante_id` | graduaciones y ámbito de personas |
| `idx_estudiantes_persona_id` | ámbito de personas |
| `idx_funcionarios_persona_id` | ámbito de personas (firmantes y asignación) |
| `idx_acta_firmantes_acta_id`, `idx_acta_firmantes_funcionario_id` | ámbito de personas (firmantes) |
| `idx_auditoria_escuela_id`, `idx_auditoria_region_id` | lectura de auditoría por ámbito |

Se declaran en la función de configuración de cada `sqliteTable` en `src/db/esquema.ts` (patrón usado por `actas`, `escaneos` y `personas`). Crear índices en SQLite es aditivo, sin bloqueo prolongado para el volumen del piloto.

### Decisión 7: Unificar la regla duplicada de ámbito de usuarios

`usuarios.servicio.ts` tiene `dentroDeAmbito(sesion, AmbitoFuncionario)`, que repite la regla nivel→ámbito. Se reemplaza por `escuelasDentroDeAmbito(ambito: AmbitoConsulta, escuelaIds, regionIds)` en `src/server/auth/ambito.ts`, usada por usuarios (escrituras) y por cualquier verificación en memoria. Comportamiento de escrituras de usuarios (decisión D5):
- `restablecerContrasena` y `cambiarEstado`: primero ámbito del destino → fuera de ámbito lanza `ErrorNoEncontrado` (`404`); luego jerarquía → rol más privilegiado lanza `ErrorProhibido` (`403`).
- `crear`: el funcionario viene en el cuerpo (no es una ruta `[id]`); fuera de ámbito sigue siendo `403`, igual que `POST` con `escuelaId` ajeno.
- El nivel 4 sigue sin acceso a usuarios (lo impide `verificarRol(sesion, 3)`).

### Decisión 8: Consulta de persona por identificación exacta con proyección mínima

**Elección** (decisión de producto D1):
- `GET /api/personas` distingue dos modos por parámetro:
  - `identificacion` presente → `servicio.buscarPersonaPorIdentificacionExacta(identificacion)` → repositorio `obtenerPersonaMinimaPorIdentificacion(db, identificacion)`: `SELECT id, nombres, apellidos, identificacion FROM personas WHERE identificacion = ?` (sin ámbito, usa `idx_personas_identificacion`). Respuesta: `PersonaMinima[]` con cero o un elemento. Nivel mínimo: cualquier sesión válida (hoy el GET no llama a `verificarRol`; se mantiene solo la verificación de sesión).
  - si no, `busqueda` (parcial) → `listarPersonas(busqueda, ambito)` con la condición de la Decisión 3.
  - Si llegan ambos, prevalece `identificacion` (coincidencia exacta).
- La proyección se define en el repositorio con columnas explícitas, no filtrando un objeto completo en el servicio, para que ningún campo adicional pueda filtrarse por accidente.
- Interfaz: `src/app/actas/nueva/page.tsx` y `src/app/actas/[id]/page.tsx` ya envían `identificacion`; se ajustan para usar el elemento solo si su `identificacion` coincide exactamente con la ingresada (defensa en profundidad) y, si la lista es vacía, crear la persona.

**Alternativas consideradas**:
- *Ámbito estricto también en la coincidencia exacta*: rechazado. Un estudiante trasladado no se encontraría y el `POST /api/personas` fallaría por identificación duplicada.
- *Endpoint separado (`/api/personas/por-identificacion`)*: rechazado. La interfaz ya usa el parámetro `identificacion`; un parámetro en la ruta existente corrige el defecto sin tocar el contrato de la interfaz.

**Justificación**: la identificación es única a nivel nacional; exponer solo la tupla mínima a quien ya conoce la cédula exacta no revela actas, escuelas ni graduaciones, y evita duplicados.

## Flujo de datos

Lectura (listado o `[id]`):

    GET /api/actas/[id]
      │ obtenerSesion() ──→ null → 401
      │ derivarAmbitoConsulta(sesion) ──→ AmbitoConsulta
      ▼
    servicio.obtenerActaPorId(id, ambito)
      ▼
    repositorio.obtenerActaPorId(db, id, ambito)
      SELECT ... FROM actas
      WHERE actas.id = ? AND <condicionEscuelaEnAmbito(ambito, actas.escuela_id)>
      │
      ├─ fila      → 200
      └─ undefined → ErrorNoEncontrado → 404 { error: "Acta no encontrada" }
                      (idéntico para inexistente y fuera de ámbito)

Escritura sobre recurso existente (IDOR):

    POST /api/actas/[id]/estudiantes
      │ sesión (401) → verificarRol(sesion, 4) (403)
      ▼
    servicio.agregarEstudiante(actaId, ..., sesion, ambito)
      │ repositorio.obtenerActaPorId(actaId, ambito) ── undefined → ErrorNoEncontrado → 404
      │                                                (sin insert, sin auditoría)
      ▼
    insert acta_estudiantes → auditor({ ..., escuelaId: acta.escuelaId }) → 201

Escritura con `escuelaId` en el cuerpo:

    POST /api/actas { escuelaId }
      │ sesión (401) → verificarRol(sesion, 4) (403)
      │ nivel 2 ? resolverAmbitoDeEscuela(escuelaId) → { regionId } | undefined(→403)
      ▼
    verificarRol(sesion, 4, { escuelaId, regionId }) ── no autorizado → 403
      ▼
    servicio.crearActa(...) → auditor({ ..., escuelaId }) → 201

Consulta exacta de persona:

    GET /api/personas?identificacion=101110111
      │ sesión (401)
      ▼
    repositorio.obtenerPersonaMinimaPorIdentificacion(db, "101110111")
      SELECT id, nombres, apellidos, identificacion FROM personas WHERE identificacion = ?
      ▼
    200 [ { id, nombres, apellidos, identificacion } ] | 200 []

## Cambios por archivo

| Archivo | Acción | Descripción |
|---|---|---|
| `src/server/auth/ambito.ts` | Crear | `AmbitoConsulta`, `derivarAmbitoConsulta(sesion)`, `escuelasDentroDeAmbito(...)` |
| `src/server/auth/tipos.ts` | Modificar | Documentar la semántica de `AmbitoVerificacion.regionId` (región de la escuela objetivo) mediante nombres/tipos; sin cambio de forma |
| `src/server/auth/autorizacion.servicio.ts` | Modificar | Regla nivel 2 con `escuelaId`: exige `regionId` de la escuela; falla cerrado si falta |
| `src/server/errores.ts` | Crear | `ErrorNoEncontrado`, `ErrorProhibido` (mantienen `name` existente) |
| `src/server/repositorios/ambito.condiciones.ts` | Crear | `condicionEscuelaEnAmbito(ambito, columna)` para Drizzle |
| `src/server/repositorios/escuelas.repositorio.ts` | Modificar | `resolverAmbitoDeEscuela(db, escuelaId)` |
| `src/server/repositorios/actas.repositorio.ts` | Modificar | `listarActas` y `obtenerActaPorId` reciben `ambito` |
| `src/server/servicios/actas.servicio.ts` | Modificar | `ambito` en lecturas; carga con ámbito antes de `agregarEstudiante`, `agregarFirmante`, `actualizarActa`, `listarEstudiantesDeActa`, `listarFirmantesDeActa`; `escuelaId` en auditoría |
| `src/app/api/actas/route.ts` | Modificar | GET con ámbito; POST resuelve región para nivel 2 |
| `src/app/api/actas/[id]/route.ts` | Modificar | GET/PATCH con ámbito; `ErrorNoEncontrado` → 404 |
| `src/app/api/actas/[id]/estudiantes/route.ts` | Modificar | GET/POST con ámbito del acta → 404; POST baja a `verificarRol(sesion, 4)` |
| `src/app/api/actas/[id]/firmantes/route.ts` | Modificar | GET/POST con ámbito del acta → 404; POST baja a `verificarRol(sesion, 4)` |
| `src/server/repositorios/escaneos.repositorio.ts` | Modificar | `listarEscaneos`, `obtenerEscaneoPorId` con `ambito` |
| `src/server/servicios/escaneos.servicio.ts` | Modificar | Lecturas y URL firmada solo tras carga con ámbito; `eliminarEscaneo` verifica ámbito; `escuelaId` en auditoría |
| `src/app/api/escaneos/route.ts` | Modificar | GET con ámbito; POST resuelve región para nivel 2 |
| `src/app/api/escaneos/[id]/route.ts` | Modificar | GET/DELETE con ámbito → 404 (DELETE deja de responder 403 por ámbito) |
| `src/app/api/escaneos/[id]/__tests__/route.test.ts` | Modificar | La prueba de eliminación de escaneo ajeno espera `404` |
| `src/server/repositorios/graduaciones.repositorio.ts` | Modificar | `construirCondiciones` y `obtenerGraduacionPorId` agregan condición de ámbito sobre `actas.escuela_id` |
| `src/server/servicios/graduaciones.servicio.ts` | Modificar | Propaga `ambito` |
| `src/app/api/graduaciones/route.ts`, `[id]/route.ts` | Modificar | Derivan y pasan `ambito` |
| `src/server/repositorios/personas.repositorio.ts` | Modificar | `listarPersonas`, `obtenerPersonaPorId` con `EXISTS` por estudiante/firmante/asignación; nueva `obtenerPersonaMinimaPorIdentificacion` |
| `src/server/servicios/personas.servicio.ts` | Modificar | Propaga `ambito` en lecturas; `buscarPersonaPorIdentificacionExacta`; `actualizarPersona` carga con ámbito |
| `src/app/api/personas/route.ts` | Modificar | GET: `identificacion` exacta (sin ámbito, datos mínimos) o `busqueda` con ámbito; POST baja a `verificarRol(sesion, 4)` |
| `src/app/api/personas/[id]/route.ts` | Modificar | GET/PATCH con ámbito → 404 |
| `src/server/repositorios/funcionarios.repositorio.ts` | Modificar | `listarFuncionarios`, `obtenerFuncionarioPorId` con `EXISTS` sobre `funcionario_escuela` |
| `src/server/servicios/funcionarios.servicio.ts` | Modificar | Propaga `ambito`; `actualizarFuncionario` carga con ámbito; `escuelaId` en auditoría de `funcionario_escuela` |
| `src/app/api/funcionarios/route.ts`, `[id]/route.ts` | Modificar | GET con ámbito; PATCH con ámbito → 404 |
| `src/server/repositorios/usuarios.repositorio.ts` | Modificar | `listarUsuarios` y nueva `obtenerUsuarioEnAmbitoPorId` con `EXISTS` sobre el funcionario |
| `src/server/servicios/usuarios.servicio.ts` | Modificar | `listar(ambito)`, `obtenerPorId(id, ambito)`; reemplaza `dentroDeAmbito` por la función compartida; escrituras `[id]` fuera de ámbito → `ErrorNoEncontrado`, jerarquía → `ErrorProhibido` |
| `src/app/api/usuarios/route.ts`, `[id]/route.ts` | Modificar | GET con ámbito; escrituras `[id]` mapean `NotFoundError` → 404 |
| `src/app/actas/nueva/page.tsx`, `src/app/actas/[id]/page.tsx` | Modificar | Usan la persona solo si su `identificacion` coincide exactamente; lista vacía → crear persona |
| `src/db/esquema.ts` | Modificar | `auditoria.escuelaId` y `auditoria.regionId` nullable; índices de la Decisión 6 |
| `drizzle/0000_*.sql` | Regenerar | Migración inicial única con todo el esquema (columnas de auditoría + índices) |
| `src/server/repositorios/auditoria.repositorio.ts` | Modificar | Inserta `escuelaId` y `regionId`; `listarAuditoria` recibe `ambito` |
| `src/server/servicios/auditoria.servicio.ts` | Modificar | `Auditor` acepta `escuelaId?` y `regionId?`; deriva la región de la escuela cuando falta |
| `src/server/servicios/auditoria.vistas.servicio.ts` | Modificar | Propaga `ambito` |
| `src/server/servicios/escuelas.servicio.ts` | Modificar | `escuelaId` en auditoría |
| `src/server/servicios/regiones.servicio.ts` | Modificar | `regionId` en auditoría de actualizar/desactivar (crear queda nacional) |
| `src/app/api/auditoria/route.ts` | Modificar | Nivel mínimo 4; pasa `ambito` |
| `test/e2e/alcance-datos.test.ts` | Crear | Conformidad de ámbito contra SQLite real |
| `docs/api-spec.yml` | Modificar | Respuestas `404` por ámbito; `identificacion` exacta en personas; auditoría niveles 1–4; nivel 4 en estudiantes/firmantes y en `POST /api/personas` |
| `docs/data-model.md` | Modificar | Notas de control de acceso (corrige las líneas ~76 y ~118, que hoy eximen al nivel 2); columnas `auditoria.escuela_id` y `auditoria.region_id`; índices |
| `docs/brd.md` | Modificar | §7.5: el Staff también ve la auditoría de su escuela |

## Interfaces y contratos

```ts
// src/server/auth/ambito.ts
export type AmbitoConsulta =
  | { tipo: "pais" }
  | { tipo: "region"; regionId: number }
  | { tipo: "escuela"; escuelaId: number }
  | { tipo: "ninguno" };

export function derivarAmbitoConsulta(sesion: SesionUsuario): AmbitoConsulta {
  if (sesion.nivel === 1) return { tipo: "pais" };
  if (sesion.nivel === 2) {
    return sesion.regionId !== undefined
      ? { tipo: "region", regionId: sesion.regionId }
      : { tipo: "ninguno" };
  }
  return sesion.escuelaId !== undefined
    ? { tipo: "escuela", escuelaId: sesion.escuelaId }
    : { tipo: "ninguno" };
}

export function escuelasDentroDeAmbito(
  ambito: AmbitoConsulta,
  escuelaIds: number[],
  regionIds: number[]
): boolean;
```

```ts
// src/server/repositorios/ambito.condiciones.ts
export function condicionEscuelaEnAmbito(
  ambito: AmbitoConsulta,
  columnaEscuelaId: SQLiteColumn
): SQL | undefined;
```

```ts
// src/server/errores.ts
export class ErrorNoEncontrado extends Error {
  override name = "NotFoundError";
}
export class ErrorProhibido extends Error {
  override name = "ForbiddenError";
}
```

```ts
// src/server/servicios/auditoria.servicio.ts
export type Auditor = (
  params: Omit<DatosAuditoria, "createdAt"> & {
    escuelaId?: number | null;
    regionId?: number | null;
  }
) => Promise<void>;
```

```ts
// src/server/repositorios/personas.repositorio.ts
export type PersonaMinima = {
  id: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
};
export function obtenerPersonaMinimaPorIdentificacion(
  db: LibSQLDatabase<typeof esquema>,
  identificacion: string
): Promise<PersonaMinima | undefined>;
```

Firmas de puerto (ejemplo; se repite el patrón en cada recurso):

```ts
listarActas: (filtros: FiltrosActas, ambito: AmbitoConsulta) => Promise<FilaActa[]>;
obtenerActaPorId: (id: number, ambito: AmbitoConsulta) => Promise<FilaActa | undefined>;
```

Contrato HTTP:
- `[id]` fuera de ámbito o inexistente → `404` con el cuerpo actual del recurso, en lecturas y escrituras.
- Listados → `200` con solo los registros del ámbito.
- `POST` con `escuelaId` ajeno o inexistente → `403` (sin cambio); `POST /api/usuarios` con funcionario fuera de ámbito → `403`.
- Usuarios `[id]` dentro de ámbito con rol más privilegiado → `403`.
- `GET /api/personas?identificacion=` → `200` con `PersonaMinima[]` (0 o 1 elemento) para cualquier sesión.
- `GET /api/auditoria`: niveles 1–4 → `200` filtrado por ámbito.

## Estrategia de pruebas

TDD estricto: cada unidad inicia con la prueba en rojo. Ejecutor: `pnpm test` (unitarias y de ruta); `pnpm test:e2e` (Vitest contra `temp-e2e.db`, no Playwright).

| Capa | Qué se prueba | Enfoque |
|---|---|---|
| Unitaria | `derivarAmbitoConsulta` (4 niveles + sesiones sin escuela/región → `ninguno`), `escuelasDentroDeAmbito` | Funciones puras, tabla de casos |
| Unitaria | `verificarRol`: nivel 2 + `escuelaId` de otra región → 403; misma región → autorizado; nivel 2 + `escuelaId` sin `regionId` → 403; casos actuales intactos | Se agregan casos a `autorizacion.test.ts` |
| Unitaria (servicio) | Actas, escaneos, graduaciones, personas, funcionarios, usuarios, auditoría: el servicio pasa el `ambito` recibido al repositorio; las escrituras IDOR lanzan `ErrorNoEncontrado` sin llamar a insertar/actualizar/eliminar ni al auditor; la URL firmada no se genera si el escaneo no se obtuvo; usuarios: fuera de ámbito → `ErrorNoEncontrado`, jerarquía → `ErrorProhibido`; el auditor deriva `regionId` de `escuelaId` | Repositorios simulados (patrón actual de `__tests__`) |
| Ruta | Por cada endpoint de la propuesta: acceso cruzado de escuela (nivel 3/4) y de región (nivel 2) → 404 en `[id]` y escrituras IDOR; cuerpo idéntico al de un id inexistente; `POST` con escuela de otra región por nivel 2 → 403; Staff → 201 en estudiantes/firmantes de su escuela y en `POST /api/personas` (duplicado → 400); auditoría nivel 4 → 200 filtrado; `personas?identificacion=` devuelve solo campos mínimos y lista vacía sin coincidencia | Patrón de `src/app/api/escaneos/[id]/__tests__/route.test.ts` (sesión y repositorios simulados). La prueba existente "retorna 403 si Admin Escuela intenta eliminar un escaneo de otra escuela" cambia a `404` |
| E2E (Vitest + SQLite) | Conformidad de ámbito: dos regiones, tres escuelas (dos en la región propia), datos en cada una; para cada nivel verifica listados, `[id]`, búsqueda de graduaciones con total/paginación, personas por vínculo (acta y asignación), identificación exacta fuera de ámbito con campos mínimos, funcionarios multi-escuela sin duplicados, auditoría con `escuela_id`/`region_id` (fila regional visible para nivel 2 y no para nivel 3; filas nacionales solo nivel 1) y filtro `escuelaId` ajeno → vacío | `test/e2e/alcance-datos.test.ts`, mismo patrón que `conformidad-brd-usuarios.test.ts`, restaurando el estado al terminar |

Nota: las pruebas actuales de repositorios simulan `db` y no validan SQL. La corrección de las condiciones SQL de ámbito (subconsulta regional, `EXISTS`) y del relleno histórico se demuestra en la prueba e2e contra SQLite real; es la verificación de referencia para la capa de datos.

## Matriz de amenazas

N/A — sin enrutamiento de procesos, comandos de shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables ni integración de procesos. (El cambio es de autorización de datos; sus amenazas —IDOR, enumeración por código de respuesta, bypass por filtro del cliente, exposición excesiva en la consulta exacta de personas— están cubiertas por los escenarios de las specs y las pruebas de ruta.)

## Migración y despliegue

- La base de datos aún no se ha publicado: hasta el primer despliegue a producción el esquema vive en **una sola migración inicial** (`drizzle/0000_*.sql`), que se regenera con `drizzle-kit generate` cada vez que cambia `src/db/esquema.ts` (y se recrean las bases locales y de prueba). Por eso no hay relleno histórico: no existen filas de auditoría previas que rellenar.
- Reversión: revertir el PR y regenerar la migración inicial desde el esquema anterior.
- Cambio de comportamiento visible (BREAKING): usuarios de nivel 2–4 ven menos datos; auditoría se abre a niveles 2–4; escrituras `[id]` fuera de ámbito pasan de `403` a `404`.

### Orden de implementación sugerido (un solo PR; ~400 líneas es solo orientativo)

1. `ambito.ts` + `errores.ts` + cambio de `verificarRol` (con pruebas unitarias).
2. `ambito.condiciones.ts` + índices (migración parte 1).
3. Actas: listado, `[id]`, subrecursos GET, escrituras IDOR y nivel 4 en estudiantes/firmantes; `POST` con resolución de región.
4. Graduaciones (búsqueda y `[id]`).
5. Escaneos (listado, `[id]` con URL firmada, `DELETE` → 404 y su prueba; `POST` con resolución de región).
6. Personas: consulta exacta por identificación con datos mínimos, `POST /api/personas` a nivel 4 + corrección de la interfaz de alta de estudiantes.
7. Personas y funcionarios: listados y `[id]` con ámbito (actas + asignación); `PATCH` con ámbito.
8. Usuarios (listado y `[id]`; escrituras `[id]` fuera de ámbito → 404; unificación de la regla).
9. Auditoría: columnas `escuela_id` y `region_id`, `Auditor` en todos los servicios (incluido regiones), lectura por ámbito, nivel mínimo 4.
10. Prueba e2e de conformidad y documentación (`api-spec.yml`, `data-model.md`, `brd.md` §7.5).

## Riesgos

- **Alta de personas por niveles 3–4 (D7)**: cualquier Staff puede crear personas; una persona recién creada sin vínculo no le será visible en listados hasta vincularla a un acta, pero sí por identificación exacta.
- **Región congelada o actual en auditoría (limitación conocida)**: el auditor deriva `region_id` de la escuela al escribir.
- **Regresión funcional para creadores**: personas y funcionarios recién creados por un Admin Regional (sin vínculo aún) dejan de ser visibles para él en listados y `[id]`, aunque sigue pudiendo encontrarlos por identificación exacta. Un funcionario creado por API no entra en el ámbito de niveles 2–4 hasta que exista la ruta de asignación (fuera de alcance).
- **Multi-escuela**: la sesión usa solo la primera escuela/región del funcionario (limitación conocida, fuera de alcance); un funcionario con varias escuelas verá solo la primera. Lo mismo aplica a la atribución de auditoría de `usuarios`.
- **Enumeración por identificación exacta**: cualquier usuario autenticado puede confirmar si una cédula existe y obtener nombre y apellidos. Aceptado por D1; la respuesta no incluye otros datos.
- **Tamaño del PR**: probablemente supera 400 líneas por la cantidad de endpoints; se asumió la estrategia `single-pr`.
- **Rendimiento**: `EXISTS` sobre personas con tres subconsultas depende de los índices nuevos; sin ellos, las búsquedas de personas harían escaneos completos.

## Preguntas abiertas

Ninguna. Todas las decisiones de producto están registradas en "Decisiones de producto tomadas" (D1–D7).

## Contradicciones detectadas entre código, propuesta y specs (resueltas)

- Esquema: la propuesta ahora declara el cambio aditivo (`auditoria.escuela_id`, `auditoria.region_id`, índices) en la migración inicial única.
- `idx_actas_escuela_id`, `idx_escaneos_escuela_id` e `idx_personas_identificacion` ya existen; la Decisión 6 solo agrega los faltantes.
- `GET /api/actas/[id]/estudiantes` y `GET /api/actas/[id]/firmantes` se agregaron a la propuesta y a la spec `alcance-datos`.
- `DELETE /api/escaneos/[id]` fuera de ámbito responde `404`; la prueba actual que espera `403` cambia (Decisión 5).
- Usuarios `[id]`: fuera de ámbito → `404`; jerarquía dentro del ámbito → `403` (D5, spec `gestion-usuarios`).
- `GET /api/personas?identificacion=` se implementa como consulta exacta (D1, Decisión 8), lo que corrige el defecto de la interfaz que tomaba `personas[0]`.
- `docs/data-model.md` (líneas ~76 y ~118) y `docs/api-spec.yml` se actualizan como tareas de este cambio.
- `PATCH /api/personas/[id]` y `PATCH /api/funcionarios/[id]` quedan dentro del alcance (D6).
- `POST /api/actas/[id]/estudiantes` a nivel 4 resuelve el escenario de Staff que antes recibía `403` (D4).
- BRD §7.5 ("admins inferiores") se actualiza para incluir al Staff (D3).
- `POST /api/personas` exigía nivel 2 aunque la interfaz de alta de estudiantes lo invoca; baja a nivel 4 (D7).
