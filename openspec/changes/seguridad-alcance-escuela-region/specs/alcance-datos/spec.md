# Delta for alcance-datos

Capacidad nueva: reglas de ámbito (país, región, escuela) que el servidor SHALL aplicar a toda lectura y escritura de actas, escaneos, graduaciones, personas, funcionarios y usuarios, incluida la respuesta `404` para recursos fuera del ámbito.

## ADDED Requirements

### Requirement: Regla de ámbito por nivel
El ámbito de datos de un actor SHALL determinarse por su nivel: Admin País (`nivel: 1`) NO SHALL tener restricción; Admin Regional (`nivel: 2`) SHALL acceder solo a recursos cuya escuela pertenezca a su `regionId`; Admin Escuela y Staff (`nivel: 3` y `4`) SHALL acceder solo a recursos de su propia `escuelaId`. La verificación SHALL ejecutarse en el servidor en cada petición y NO SHALL depender de filtros de la interfaz.

#### Scenario: Admin País no tiene restricción
- **GIVEN** un Admin País autenticado
- **WHEN** consulta recursos de cualquier escuela de cualquier región
- **THEN** el sistema devuelve los recursos sin filtrar por ámbito

#### Scenario: Admin Regional accede a otra escuela de su región
- **GIVEN** un Admin Regional de `region_id: 2` y una escuela `escuela_id: 10` de `region_id: 2`
- **WHEN** consulta un recurso de la escuela 10
- **THEN** el sistema permite el acceso

#### Scenario: Admin Regional no accede a otra región
- **GIVEN** un Admin Regional de `region_id: 2` y una escuela de `region_id: 3`
- **WHEN** consulta un recurso de esa escuela
- **THEN** el sistema trata el recurso como fuera del ámbito

#### Scenario: La autorización por escuela resuelve la región de la escuela objetivo
- **GIVEN** un Admin Regional de `region_id: 2`
- **WHEN** se autoriza una operación contra `escuelaId: 20` que pertenece a `region_id: 3`
- **THEN** el sistema resuelve la región de la escuela 20, la compara con la del actor y rechaza la operación

### Requirement: Recurso fuera del ámbito responde 404 en rutas por id
Las rutas que identifican un recurso por `[id]` SHALL responder `404` cuando el recurso exista pero esté fuera del ámbito del actor, con el mismo cuerpo que un recurso inexistente, para no revelar su existencia. Esta regla SHALL aplicarse tanto a lecturas como a escrituras (`POST`, `PATCH`, `DELETE`) sobre un recurso `[id]` existente. Los listados y búsquedas SHALL excluir silenciosamente los registros fuera del ámbito, sin error y sin indicar que existen registros excluidos. Un nivel insuficiente para la operación SHALL seguir respondiendo `403` antes de evaluar el ámbito del recurso.

#### Scenario: Recurso fuera de ámbito y recurso inexistente son indistinguibles
- **GIVEN** un Admin Escuela de `escuela_id: 5`, un acta existente de `escuela_id: 10` y un id de acta inexistente
- **WHEN** consulta `GET /api/actas/[id]` con cada uno de ambos ids
- **THEN** ambas respuestas tienen código `404` y el mismo cuerpo

#### Scenario: Los listados excluyen sin error
- **GIVEN** un Staff de `escuela_id: 5` y registros de las escuelas 5 y 10
- **WHEN** consulta cualquier endpoint de listado
- **THEN** la respuesta es `200` y contiene solo registros de la escuela 5
- **AND** el total y la paginación reflejan únicamente los registros visibles

### Requirement: Actas limitadas al ámbito
`GET /api/actas` SHALL devolver solo actas dentro del ámbito del actor. `GET /api/actas/[id]`, `GET /api/actas/[id]/estudiantes` y `GET /api/actas/[id]/firmantes` SHALL responder `404` para un acta fuera del ámbito. Las escrituras sobre un acta existente (`POST /api/actas/[id]/estudiantes`, `POST /api/actas/[id]/firmantes` y `PATCH /api/actas/[id]` mientras el endpoint exista) SHALL verificar el ámbito de la escuela del acta y responder `404` sin modificar datos ni registrar auditoría cuando esté fuera del ámbito. `POST /api/actas/[id]/estudiantes` y `POST /api/actas/[id]/firmantes` SHALL permitir nivel mínimo 4 (Staff), de modo que quien puede registrar un acta en su escuela también puede completar sus estudiantes y firmantes.

#### Scenario: Nivel 3 lista solo actas de su escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y actas de las escuelas 5 y 10
- **WHEN** envía `GET /api/actas`
- **THEN** la respuesta contiene solo actas de la escuela 5

#### Scenario: Nivel 3 consulta un acta de otra escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y un acta de `escuela_id: 10`
- **WHEN** envía `GET /api/actas/[id]` con el id de esa acta
- **THEN** la respuesta tiene código `404`

#### Scenario: Nivel 2 no lista actas de otra región
- **GIVEN** un Admin Regional de `region_id: 2` y actas de escuelas de las regiones 2 y 3
- **WHEN** envía `GET /api/actas`
- **THEN** la respuesta contiene actas de escuelas de la región 2 (de cualquiera de sus escuelas) y ninguna de la región 3

#### Scenario: Nivel 2 consulta un acta de otra región
- **GIVEN** un Admin Regional de `region_id: 2` y un acta de una escuela de `region_id: 3`
- **WHEN** envía `GET /api/actas/[id]`
- **THEN** la respuesta tiene código `404`

#### Scenario: Nivel 2 consulta un acta de otra escuela de su región
- **GIVEN** un Admin Regional de `region_id: 2` y un acta de una escuela de `region_id: 2`
- **WHEN** envía `GET /api/actas/[id]`
- **THEN** la respuesta tiene código `200`

#### Scenario: Nivel 1 ve actas de todas las escuelas
- **GIVEN** un Admin País y actas de varias regiones
- **WHEN** envía `GET /api/actas`
- **THEN** la respuesta incluye actas de todas las regiones

#### Scenario: Estudiantes y firmantes de un acta ajena no se exponen
- **GIVEN** un Staff de `escuela_id: 5` y un acta de `escuela_id: 10`
- **WHEN** envía `GET /api/actas/[id]/estudiantes` o `GET /api/actas/[id]/firmantes` con el id de esa acta
- **THEN** la respuesta tiene código `404` con el mismo cuerpo que para un acta inexistente

#### Scenario: Staff agrega estudiantes a un acta de su escuela
- **GIVEN** un Staff de `escuela_id: 5` y un acta de `escuela_id: 5`
- **WHEN** envía `POST /api/actas/[id]/estudiantes` con datos válidos
- **THEN** la respuesta tiene código `201` y el estudiante queda vinculado al acta

#### Scenario: Staff agrega firmantes a un acta de su escuela
- **GIVEN** un Staff de `escuela_id: 5` y un acta de `escuela_id: 5`
- **WHEN** envía `POST /api/actas/[id]/firmantes` con datos válidos
- **THEN** la respuesta tiene código `201` y el firmante queda vinculado al acta

#### Scenario: IDOR al agregar estudiantes a un acta ajena
- **GIVEN** un Staff de `escuela_id: 5` y un acta de `escuela_id: 10`
- **WHEN** envía `POST /api/actas/[id]/estudiantes` con el id de esa acta
- **THEN** la respuesta tiene código `404`
- **AND** no se agregan estudiantes ni se registra auditoría de escritura

#### Scenario: IDOR al agregar firmantes a un acta ajena
- **GIVEN** un Staff de `escuela_id: 5` y un acta de `escuela_id: 10`
- **WHEN** envía `POST /api/actas/[id]/firmantes` con el id de esa acta
- **THEN** la respuesta tiene código `404`
- **AND** no se agregan firmantes ni se registra auditoría de escritura

#### Scenario: IDOR al modificar un acta ajena
- **GIVEN** un Admin Regional de `region_id: 2` y un acta de una escuela de `region_id: 3`
- **WHEN** envía `PATCH /api/actas/[id]` con el id de esa acta
- **THEN** la respuesta tiene código `404` y el acta no cambia

### Requirement: Escaneos limitados al ámbito y sin URL firmada fuera del ámbito
`GET /api/escaneos` SHALL devolver solo escaneos dentro del ámbito del actor. `GET /api/escaneos/[id]` SHALL responder `404` para un escaneo fuera del ámbito. El sistema NO SHALL emitir una URL firmada de lectura de R2 para un escaneo fuera del ámbito del actor. `DELETE /api/escaneos/[id]` SHALL verificar el ámbito de la escuela del escaneo y responder `404` sin eliminarlo cuando esté fuera del ámbito.

#### Scenario: Nivel 4 lista solo escaneos de su escuela
- **GIVEN** un Staff de `escuela_id: 5` y escaneos de las escuelas 5 y 10
- **WHEN** envía `GET /api/escaneos`
- **THEN** la respuesta contiene solo escaneos de la escuela 5

#### Scenario: La URL firmada de lectura no se emite fuera del ámbito
- **GIVEN** un Staff de `escuela_id: 5` y un escaneo de `escuela_id: 10`
- **WHEN** envía `GET /api/escaneos/[id]` con el id de ese escaneo
- **THEN** la respuesta tiene código `404`
- **AND** no se genera ninguna URL firmada de R2 para ese escaneo

#### Scenario: URL firmada dentro del ámbito
- **GIVEN** un Staff de `escuela_id: 5` y un escaneo de `escuela_id: 5`
- **WHEN** envía `GET /api/escaneos/[id]`
- **THEN** la respuesta es `200` e incluye la URL firmada de lectura

#### Scenario: IDOR al eliminar un escaneo ajeno
- **GIVEN** un Admin Escuela de `escuela_id: 5` y un escaneo de `escuela_id: 10`
- **WHEN** envía `DELETE /api/escaneos/[id]` con el id de ese escaneo
- **THEN** la respuesta tiene código `404`
- **AND** el escaneo y su objeto en R2 permanecen sin cambios

#### Scenario: Nivel 2 no lee escaneos de otra región
- **GIVEN** un Admin Regional de `region_id: 2` y un escaneo de una escuela de `region_id: 3`
- **WHEN** envía `GET /api/escaneos/[id]`
- **THEN** la respuesta tiene código `404` y no se emite URL firmada

### Requirement: Graduaciones y su búsqueda limitadas al ámbito
`GET /api/graduaciones` (incluida la búsqueda por identificación o nombre) SHALL devolver solo graduaciones dentro del ámbito del actor; la consulta NO SHALL ser nacional para los niveles 2 a 4. `GET /api/graduaciones/[id]` SHALL responder `404` para una graduación fuera del ámbito.

#### Scenario: La búsqueda de graduaciones de nivel 3 no devuelve otras escuelas
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una persona con graduaciones en las escuelas 5 y 10
- **WHEN** busca por su número de identificación en `GET /api/graduaciones`
- **THEN** los resultados incluyen solo la graduación de la escuela 5

#### Scenario: Búsqueda sin coincidencias dentro del ámbito
- **GIVEN** un Staff de `escuela_id: 5` y una persona con graduaciones únicamente en la escuela 10
- **WHEN** busca por su número de identificación
- **THEN** la respuesta es `200` con resultado vacío ("Sin registros")
- **AND** no se indica que existan registros fuera del ámbito

#### Scenario: Consulta por id de graduación de otra escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una graduación de `escuela_id: 10`
- **WHEN** envía `GET /api/graduaciones/[id]`
- **THEN** la respuesta tiene código `404`

#### Scenario: Búsqueda de nivel 2 limitada a su región
- **GIVEN** un Admin Regional de `region_id: 2` y graduaciones de una persona en escuelas de las regiones 2 y 3
- **WHEN** busca por su identificación
- **THEN** los resultados incluyen solo las graduaciones de escuelas de la región 2

### Requirement: Personas y funcionarios limitados al ámbito
`GET /api/personas` (incluida la búsqueda parcial por nombre o identificación con el parámetro `busqueda`) y `GET /api/funcionarios`, y sus rutas `[id]`, SHALL limitarse a las escuelas del ámbito del actor. Una persona SHALL considerarse dentro del ámbito cuando aparezca en al menos un acta de una escuela del ámbito (como estudiante o como firmante) o cuando sea un funcionario asignado (`funcionario_escuela`) a una escuela del ámbito. Un funcionario SHALL considerarse dentro del ámbito cuando esté asignado a al menos una escuela del ámbito. Las personas y funcionarios sin ninguno de esos vínculos SHALL ser visibles solo para el Admin País (`nivel: 1`) en listados y rutas `[id]`. Los recursos fuera del ámbito SHALL responder `404` en las rutas `[id]` y omitirse en los listados. Las escrituras sobre un recurso existente (`PATCH /api/personas/[id]` y `PATCH /api/funcionarios/[id]`) SHALL verificar el ámbito del recurso y responder `404` sin modificar datos ni registrar auditoría cuando esté fuera del ámbito.

#### Scenario: Nivel 3 lista solo funcionarios de su escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y funcionarios asignados a las escuelas 5 y 10
- **WHEN** envía `GET /api/funcionarios`
- **THEN** la respuesta contiene solo funcionarios asignados a la escuela 5

#### Scenario: Consulta por id de funcionario de otra región
- **GIVEN** un Admin Regional de `region_id: 2` y un funcionario asignado a una escuela de `region_id: 3`
- **WHEN** envía `GET /api/funcionarios/[id]`
- **THEN** la respuesta tiene código `404`

#### Scenario: Persona en ámbito por aparecer en un acta de la escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una persona que figura como estudiante o firmante en un acta de la escuela 5
- **WHEN** envía `GET /api/personas/[id]` para esa persona
- **THEN** la respuesta tiene código `200`

#### Scenario: Persona en ámbito por ser funcionario asignado a la escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una persona que es funcionario asignado a la escuela 5 y no figura en ninguna acta
- **WHEN** envía `GET /api/personas` o `GET /api/personas/[id]` para esa persona
- **THEN** el listado la incluye y la consulta por id responde `200`

#### Scenario: Nivel 4 no ve personas sin vínculo con su escuela
- **GIVEN** un Staff de `escuela_id: 5` y una persona sin actas en la escuela 5 y sin asignación como funcionario a la escuela 5
- **WHEN** envía `GET /api/personas` o `GET /api/personas/[id]` para esa persona
- **THEN** el listado no la incluye y la consulta por id responde `404`

#### Scenario: Personas y funcionarios sin vínculo son visibles solo para nivel 1
- **GIVEN** una persona sin actas ni asignación a escuelas y un funcionario sin escuela asignada
- **WHEN** un Admin Regional los consulta en `GET /api/personas/[id]` y `GET /api/funcionarios/[id]`
- **THEN** ambas respuestas tienen código `404`
- **AND** un Admin País obtiene `200` en las mismas consultas

#### Scenario: La búsqueda parcial de personas excluye personas fuera del ámbito
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una persona "Ana Mora" vinculada solo a la escuela 10
- **WHEN** envía `GET /api/personas?busqueda=Mora`
- **THEN** la respuesta es `200` y no incluye a esa persona

#### Scenario: IDOR al modificar una persona fuera del ámbito
- **GIVEN** un Admin Regional de `region_id: 2` y una persona vinculada solo a escuelas de `region_id: 3`
- **WHEN** envía `PATCH /api/personas/[id]` con el id de esa persona
- **THEN** la respuesta tiene código `404`
- **AND** la persona no cambia y no se registra auditoría de escritura

#### Scenario: IDOR al modificar un funcionario fuera del ámbito
- **GIVEN** un Admin Regional de `region_id: 2` y un funcionario asignado solo a escuelas de `region_id: 3`
- **WHEN** envía `PATCH /api/funcionarios/[id]` con el id de ese funcionario
- **THEN** la respuesta tiene código `404`
- **AND** el funcionario no cambia y no se registra auditoría de escritura

#### Scenario: Nivel 1 ve todas las personas y funcionarios
- **GIVEN** un Admin País
- **WHEN** envía `GET /api/personas` y `GET /api/funcionarios`
- **THEN** las respuestas incluyen registros de todas las escuelas, incluidos los que no tienen vínculo con ninguna escuela

### Requirement: Consulta de persona por identificación exacta con datos mínimos
`GET /api/personas?identificacion=<valor>` SHALL buscar por coincidencia exacta del número de identificación y SHALL estar disponible para cualquier usuario autenticado, sin restricción de ámbito, porque la identificación de una persona es única a nivel nacional y la consulta es necesaria para vincular a una persona existente sin crear duplicados. La respuesta SHALL contener únicamente los datos mínimos para vincular (`id`, nombres, apellidos e `identificacion`) y NO SHALL incluir actas, escuelas, graduaciones ni ningún otro campo de la persona. Cuando no exista coincidencia exacta, la respuesta SHALL ser `200` con una lista vacía. Esta excepción aplica solo a la coincidencia exacta; la búsqueda parcial (`busqueda`) SHALL seguir limitada al ámbito. La interfaz de registro de estudiantes SHALL usar esta consulta y vincular únicamente a la persona cuya identificación coincide exactamente, nunca al primer elemento de un listado general.

#### Scenario: La coincidencia exacta devuelve solo campos mínimos
- **GIVEN** un Staff de `escuela_id: 5` y una persona con identificación `101110111` vinculada a la escuela 5
- **WHEN** envía `GET /api/personas?identificacion=101110111`
- **THEN** la respuesta es `200` con una lista de un único elemento
- **AND** el elemento contiene solo `id`, nombres, apellidos e `identificacion`

#### Scenario: Sin coincidencia exacta la lista es vacía
- **GIVEN** un usuario autenticado y ninguna persona con identificación `999999999`
- **WHEN** envía `GET /api/personas?identificacion=999999999`
- **THEN** la respuesta es `200` con una lista vacía
- **AND** no se devuelve ninguna otra persona como sustituto

#### Scenario: Persona fuera del ámbito encontrada por identificación exacta
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una persona con identificación `202220222` vinculada solo a la escuela 10 (p. ej. un estudiante trasladado)
- **WHEN** envía `GET /api/personas?identificacion=202220222`
- **THEN** la respuesta es `200` con esa persona y solo sus campos mínimos
- **AND** la respuesta no incluye actas, escuelas ni graduaciones de la escuela 10

#### Scenario: Una identificación parcial no activa la consulta exacta
- **GIVEN** un Admin Escuela de `escuela_id: 5` y una persona con identificación `202220222` vinculada solo a la escuela 10
- **WHEN** envía `GET /api/personas?identificacion=20222`
- **THEN** la respuesta es `200` con una lista vacía

#### Scenario: Sin sesión la consulta exacta responde 401
- **WHEN** una petición sin sesión envía `GET /api/personas?identificacion=101110111`
- **THEN** la respuesta tiene código `401`

### Requirement: Registro de personas por Staff
`POST /api/personas` SHALL permitir nivel mínimo 4 (Staff), de modo que quien registra un acta en su escuela también pueda dar de alta a un estudiante nuevo. Toda creación SHALL registrarse en la auditoría. La identificación SHALL seguir siendo única: si ya existe una persona con la misma identificación, el sistema SHALL mantener el comportamiento actual (respuesta `400` con el mensaje de identificación duplicada) y NO SHALL crear un duplicado ni registrar auditoría de escritura.

#### Scenario: Staff crea una persona nueva
- **GIVEN** un Staff de `escuela_id: 5` y ninguna persona con identificación `303330333`
- **WHEN** envía `POST /api/personas` con identificación `303330333`, nombres y apellidos válidos
- **THEN** la respuesta tiene código `201` y la persona queda creada
- **AND** se registra un registro de auditoría de creación en la tabla `personas`

#### Scenario: Identificación duplicada al crear una persona
- **GIVEN** un Staff de `escuela_id: 5` y una persona existente con identificación `303330333`
- **WHEN** envía `POST /api/personas` con identificación `303330333`
- **THEN** la respuesta tiene código `400` con el mensaje de identificación duplicada
- **AND** no se crea una nueva persona ni se registra auditoría de escritura

#### Scenario: Sin sesión la creación de personas responde 401
- **WHEN** una petición sin sesión envía `POST /api/personas`
- **THEN** la respuesta tiene código `401`

### Requirement: Usuarios limitados al ámbito en lectura
`GET /api/usuarios` SHALL devolver solo usuarios cuyo funcionario pertenezca al ámbito del actor, y `GET /api/usuarios/[id]` SHALL responder `404` para un usuario fuera del ámbito. La regla SHALL aplicarse además de la jerarquía de niveles existente.

#### Scenario: Nivel 3 lista solo usuarios de su escuela
- **GIVEN** un Admin Escuela de `escuela_id: 5` y usuarios de las escuelas 5 y 10
- **WHEN** envía `GET /api/usuarios`
- **THEN** la respuesta contiene solo usuarios cuyo funcionario pertenece a la escuela 5

#### Scenario: Nivel 2 consulta un usuario de otra región
- **GIVEN** un Admin Regional de `region_id: 2` y un usuario cuyo funcionario pertenece a una escuela de `region_id: 3`
- **WHEN** envía `GET /api/usuarios/[id]`
- **THEN** la respuesta tiene código `404`

#### Scenario: Nivel 1 lista todos los usuarios
- **GIVEN** un Admin País
- **WHEN** envía `GET /api/usuarios`
- **THEN** la respuesta incluye usuarios de todas las escuelas y regiones

### Requirement: Las verificaciones de ámbito no dependen de datos enviados por el cliente
El ámbito del actor SHALL derivarse de la sesión y del recurso almacenado, y NO SHALL derivarse de parámetros de consulta o cuerpo de la petición (por ejemplo, un `escuelaId` o `regionId` enviado como filtro). Un filtro solicitado por el cliente SHALL únicamente restringir aún más el resultado, nunca ampliarlo más allá del ámbito. La única excepción es la consulta por identificación exacta de personas, que devuelve solo datos mínimos.

#### Scenario: Un filtro por escuela ajena no amplía el ámbito
- **GIVEN** un Admin Escuela de `escuela_id: 5`
- **WHEN** envía `GET /api/actas?escuelaId=10`
- **THEN** la respuesta es `200` con resultado vacío y no contiene actas de la escuela 10
