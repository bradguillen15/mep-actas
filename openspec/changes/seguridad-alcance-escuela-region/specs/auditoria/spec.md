# Delta for auditoria

## MODIFIED Requirements

### Requirement: Registro de auditoría para toda escritura
Toda operación de escritura (crear, editar, desactivar) SHALL registrar en la tabla `auditoria`: `usuario_id`, `tabla`, `registro_id`, `accion`, `datos_anteriores` (JSON), `datos_nuevos` (JSON), `created_at`, y además `escuela_id` y `region_id` (ambos nullable) que identifican el ámbito del recurso auditado. Ambos valores SHALL poblarse en el momento de escribir: cuando el recurso auditado pertenece a una escuela, `escuela_id` SHALL ser esa escuela y `region_id` SHALL derivarse de la región de esa escuela; cuando el recurso pertenece solo a una región (p. ej. la actualización o desactivación de una región), `escuela_id` SHALL ser `NULL` y `region_id` SHALL ser esa región; cuando el recurso es de alcance nacional (p. ej. `tipos_acta`, la creación de una región, personas o funcionarios sin escuela resoluble), ambos SHALL ser `NULL`.
(Previously: el registro no incluía `escuela_id` ni `region_id`; no era posible filtrar la auditoría por ámbito)

#### Scenario: El servicio de auditoría registra una creación
- **WHEN** se llama a `registrarAuditoria({ usuario_id: 1, tabla: "actas", registro_id: 10, accion: "crear", datos_anteriores: null, datos_nuevos: { titulo: "Acta 2025" } })`
- **THEN** la tabla `auditoria` contiene un nuevo registro con esos datos

#### Scenario: Registro de un recurso de escuela deriva la región
- **GIVEN** la escuela `escuela_id: 5` que pertenece a `region_id: 2`
- **WHEN** se registra la auditoría de la creación de un acta de la escuela 5
- **THEN** el registro tiene `escuela_id: 5` y `region_id: 2`

#### Scenario: Registro de un recurso de región sin escuela
- **WHEN** se registra la auditoría de la actualización de la región `region_id: 2`
- **THEN** el registro tiene `escuela_id` `NULL` y `region_id: 2`

#### Scenario: Registro de un recurso nacional
- **WHEN** se registra la auditoría de la creación de un tipo de acta
- **THEN** el registro tiene `escuela_id` y `region_id` en `NULL`

### Requirement: Auditoría de solo lectura
La tabla `auditoria` SHALL ser de solo lectura: no SHALL existir endpoints para modificar o eliminar registros de auditoría. La consulta `GET /api/auditoria` SHALL estar disponible para los niveles 1 a 4, filtrada por el ámbito del actor según `escuela_id` y `region_id` del registro: el Admin País (nivel 1) SHALL ver toda la auditoría; el Admin Regional (nivel 2) SHALL ver todos los registros de su región, incluidos los registros de nivel regional sin escuela; el Admin Escuela (nivel 3) y el Staff (nivel 4) SHALL ver solo los registros de su escuela. Los registros sin `escuela_id` ni `region_id` SHALL ser visibles solo para el nivel 1.
(Previously: solo el nivel 1 podía consultar la auditoría; no se definía consulta por ámbito para los niveles 2 a 4)

#### Scenario: No hay endpoint de modificación de auditoría
- **WHEN** se inspeccionan los route handlers
- **THEN** no existe ningún método PATCH, PUT o DELETE para `auditoria`

#### Scenario: Admin País ve toda la auditoría
- **GIVEN** registros de auditoría de escuelas de varias regiones, registros de nivel regional y registros sin escuela ni región
- **WHEN** un Admin País envía `GET /api/auditoria`
- **THEN** la respuesta incluye todos los registros

#### Scenario: Admin Regional ve solo la auditoría de su región
- **GIVEN** un Admin Regional de `region_id: 2` y registros de auditoría de escuelas de las regiones 2 y 3
- **WHEN** envía `GET /api/auditoria`
- **THEN** la respuesta incluye solo registros de escuelas de la región 2

#### Scenario: Admin Regional ve registros de su región sin escuela
- **GIVEN** un Admin Regional de `region_id: 2` y un registro de auditoría con `escuela_id` `NULL` y `region_id: 2` (p. ej. la actualización de su región)
- **WHEN** envía `GET /api/auditoria`
- **THEN** la respuesta incluye ese registro

#### Scenario: Admin Escuela ve solo la auditoría de su escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y registros de auditoría de las escuelas 5 y 10
- **WHEN** envía `GET /api/auditoria`
- **THEN** la respuesta incluye solo registros de la escuela 5

#### Scenario: Admin Escuela no ve registros de nivel regional
- **GIVEN** un Admin Escuela de `escuela_id: 5`, de una escuela de `region_id: 2`, y un registro con `escuela_id` `NULL` y `region_id: 2`
- **WHEN** envía `GET /api/auditoria`
- **THEN** la respuesta no incluye ese registro

#### Scenario: Staff ve solo la auditoría de su escuela
- **GIVEN** un Staff (nivel 4) de `escuela_id: 5` y registros de auditoría de las escuelas 5 y 10
- **WHEN** envía `GET /api/auditoria`
- **THEN** la respuesta tiene código `200` e incluye solo registros de la escuela 5

#### Scenario: Registros nacionales solo para nivel 1
- **GIVEN** un registro de auditoría sin `escuela_id` ni `region_id`
- **WHEN** un Admin Regional, un Admin Escuela o un Staff envía `GET /api/auditoria`
- **THEN** la respuesta no incluye ese registro

#### Scenario: Sin sesión la auditoría responde 401
- **WHEN** una petición sin sesión envía `GET /api/auditoria`
- **THEN** la respuesta tiene código `401`
