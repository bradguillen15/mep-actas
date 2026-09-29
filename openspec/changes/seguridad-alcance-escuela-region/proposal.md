## Why

Hoy la autorización verifica el **nivel** del usuario pero no el **ámbito** de los datos en la mayoría de las lecturas ni en varias escrituras: cualquier usuario autenticado puede listar actas, escaneos (con URL firmada), graduaciones y usuarios de cualquier escuela, y un Admin Regional puede operar sobre escuelas de otras regiones. Esto contradice el BRD §6 ("Staff: consulta y registro dentro de su escuela"), §7.5 (auditoría por ámbito) y el objetivo de "privacidad por defecto", y expone datos personales protegidos por la Ley 8968. Además, la interfaz de registro de estudiantes consulta `GET /api/personas?identificacion=...`, pero la ruta solo lee `busqueda`: el filtro se ignora y la interfaz toma la primera persona del listado, por lo que puede vincular a la persona equivocada a un acta. Debe cerrarse antes de ampliar el piloto a más escuelas.

## What Changes

- **Regla de ámbito única para lecturas y escrituras**: Admin País (nivel 1) sin restricción; Admin Regional (nivel 2) solo escuelas de su región; Admin Escuela y Staff (niveles 3–4) solo su escuela. Decisión de negocio: la consulta de graduaciones **no** es nacional; también se limita al ámbito.
- **Corrección del bypass de nivel 2**: al autorizar contra una `escuelaId`, un Admin Regional se valida resolviendo la región de esa escuela (hoy la comparación de escuela se omite para nivel ≤ 2).
- **Lecturas filtradas por ámbito**:
  - `GET /api/actas`, `GET /api/actas/[id]`, `GET /api/actas/[id]/estudiantes` y `GET /api/actas/[id]/firmantes`
  - `GET /api/escaneos` y `GET /api/escaneos/[id]` (incluye la emisión de URL firmada de lectura)
  - `GET /api/graduaciones` y `GET /api/graduaciones/[id]`
  - `GET /api/usuarios` y `GET /api/usuarios/[id]`
  - `GET /api/personas` (búsqueda parcial `busqueda`) y `GET /api/funcionarios` (y sus `[id]`). Una persona está en ámbito si aparece en un acta (como estudiante o firmante) de una escuela del ámbito o si es funcionario asignado a una escuela del ámbito; un funcionario, si está asignado a una escuela del ámbito. Personas y funcionarios sin vínculo solo son visibles para el nivel 1.
  - `GET /api/auditoria`: se abre a niveles 2–4 filtrada por su ámbito (hoy solo nivel 1). El nivel 2 ve toda su región, incluidos los registros regionales sin escuela; los niveles 3 y 4 ven solo su escuela; los registros nacionales solo el nivel 1.
- **Consulta de persona por identificación exacta**: `GET /api/personas?identificacion=<exacta>` devuelve, a cualquier usuario autenticado y sin restricción de ámbito, solo los datos mínimos para vincular (`id`, nombres, apellidos, `identificacion`); sin coincidencia devuelve una lista vacía. Corrige el defecto actual por el que el parámetro se ignoraba, y la interfaz (`src/app/actas/nueva/page.tsx`, `src/app/actas/[id]/page.tsx`) deja de tomar el primer elemento de un listado general.
- **Escrituras sobre recursos existentes verifican el ámbito del recurso** (IDOR): `POST /api/actas/[id]/estudiantes`, `POST /api/actas/[id]/firmantes`, `PATCH /api/actas/[id]` mientras exista, `DELETE /api/escaneos/[id]`, `PATCH /api/personas/[id]`, `PATCH /api/funcionarios/[id]`, y el restablecimiento de contraseña y cambio de estado de `usuarios/[id]`.
- **`POST /api/actas/[id]/estudiantes` y `POST /api/actas/[id]/firmantes` bajan a nivel mínimo 4 (Staff)**, con la verificación de ámbito del acta, por coherencia con el registro de actas por Staff (BRD §6).
- **`POST /api/personas` baja de nivel mínimo 2 a nivel 4 (Staff)**, para que Admin Escuela y Staff puedan dar de alta a un estudiante nuevo al registrar un acta; la identificación sigue siendo única (duplicado → `400` actual) y toda creación se audita.
- Un recurso fuera del ámbito responde **404** (no 403) en las rutas `[id]`, tanto en lecturas como en escrituras, para no revelar su existencia. En usuarios, un destino dentro del ámbito pero de un rol más privilegiado sigue respondiendo `403` (violación de jerarquía).
- **Auditoría por ámbito**: la tabla `auditoria` agrega `escuela_id` y `region_id` (nullable), poblados al escribir y rellenados para el historial resoluble.
- **BREAKING (comportamiento)**: usuarios de nivel 2–4 dejan de ver datos fuera de su ámbito en listados y búsquedas; `DELETE /api/escaneos/[id]` y las escrituras de `usuarios/[id]` fuera de ámbito pasan de `403` a `404`. Cambios de nivel mínimo: `POST /api/actas/[id]/estudiantes` y `POST /api/actas/[id]/firmantes` (3 → 4), `POST /api/personas` (2 → 4), `GET /api/auditoria` (1 → 4).

Fuera de alcance (cambios posteriores): inmutabilidad de actas (eliminar `PATCH /api/actas/[id]`), funcionarios con múltiples escuelas (hoy se usa la primera asignada), revalidación del JWT contra la base de datos, y la ruta de API para asignar un funcionario a una escuela (hoy `asignarFuncionarioAEscuela` solo existe en el servicio; es deuda para otro cambio).

## Capabilities

### New Capabilities
- `alcance-datos`: reglas de ámbito (país/región/escuela) aplicadas a toda lectura y escritura de actas, escaneos, graduaciones, personas, funcionarios y usuarios, incluida la respuesta 404 para recursos fuera del ámbito la consulta de persona por identificación exacta con datos mínimos y el registro de personas por Staff.

### Modified Capabilities
- `autenticacion-roles`: el requisito "Autorización con verificación de nivel y ámbito" cambia para que el nivel 2 se valide por la región de la escuela objetivo.
- `auditoria`: el registro agrega `escuela_id` y `region_id`; la consulta se abre a niveles 1–4 filtrada por ámbito.
- `gestion-usuarios`: los listados y la consulta por id se limitan al ámbito del actor; las escrituras `[id]` sobre un destino fuera de ámbito responden `404`.

## Impact

- **Código**: `src/server/auth/autorizacion.servicio.ts`, servicios y repositorios de actas, escaneos, graduaciones, personas, funcionarios, usuarios y auditoría (nuevos filtros por `escuelaId`/`regionId`), los route handlers listados arriba y las páginas `src/app/actas/nueva/page.tsx` y `src/app/actas/[id]/page.tsx` (consulta por identificación exacta).
- **Base de datos**: **sí cambia el esquema**, de forma aditiva: columnas nullable `auditoria.escuela_id` y `auditoria.region_id` con sus índices, más índices de apoyo a los filtros de ámbito; como la base no se ha publicado, el esquema completo se consolida en una sola migración inicial regenerada, sin relleno histórico.
- **Frontend**: los listados devuelven menos datos para niveles 2–4; el alta de estudiantes usa la consulta exacta por identificación.
- **Pruebas**: nuevas pruebas unitarias de servicio y de ruta que intentan cruzar escuela y región por cada endpoint, y una prueba e2e de conformidad de ámbito. La prueba existente que espera `403` al eliminar un escaneo de otra escuela cambia a `404`.
- **Documentación** (tareas de este cambio):
  - `docs/api-spec.yml`: respuestas `404` por ámbito, parámetro `identificacion` de personas, auditoría niveles 1–4, nivel 4 en estudiantes/firmantes y en `POST /api/personas`.
  - `docs/data-model.md`: corregir las notas de las líneas ~76 y ~118, que eximen al nivel 2 de la verificación de escuela; documentar `auditoria.escuela_id`, `auditoria.region_id` e índices.
  - `docs/brd.md` §7.5: hoy dice que la auditoría la ven "los admins inferiores"; debe actualizarse porque el Staff (nivel 4) también verá la auditoría de su escuela.
