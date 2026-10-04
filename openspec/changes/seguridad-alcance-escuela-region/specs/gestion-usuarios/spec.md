# Delta for gestion-usuarios

## MODIFIED Requirements

### Requirement: Gestión de usuarios respeta el ámbito de región/escuela
Al listar, consultar por id, crear, restablecer contraseña o cambiar el estado de un usuario, el servicio SHALL verificar que el funcionario destino pertenezca al ámbito del usuario en sesión: un Admin Regional (`nivel: 2`) solo SHALL acceder a usuarios cuyo funcionario pertenece a una escuela de su `region_id`; un Admin Escuela (`nivel: 3`) solo SHALL acceder a usuarios cuyo funcionario pertenece a su `escuela_id`; un Admin País (`nivel: 1`) NO SHALL tener restricción de ámbito. Los listados SHALL excluir silenciosamente a los usuarios fuera del ámbito. Las operaciones sobre un usuario identificado por `[id]` (consultar, restablecer contraseña, cambiar estado) SHALL tratar a un usuario fuera del ámbito como no encontrado y responder `404`, con el mismo cuerpo que un usuario inexistente, sin modificar datos ni registrar auditoría. Al crear un usuario, si el funcionario indicado en el cuerpo está fuera del ámbito, el servicio SHALL rechazar la operación con un error de autorización (`403`).
(Previously: la verificación de ámbito aplicaba solo a crear, restablecer contraseña y cambiar estado, siempre con error de autorización; los listados y la consulta por id no se limitaban al ámbito)

#### Scenario: Admin Escuela no crea usuarios para otra escuela
- **WHEN** un Admin Escuela de `escuela_id: 5` intenta crear un usuario cuyo funcionario pertenece a `escuela_id: 10`
- **THEN** el servicio rechaza la operación con error de autorización y la respuesta tiene código `403`

#### Scenario: Admin Escuela no modifica usuarios de otra escuela
- **WHEN** un Admin Escuela de `escuela_id: 5` intenta restablecer la contraseña o cambiar el estado de un usuario cuyo funcionario pertenece a `escuela_id: 10`
- **THEN** la respuesta tiene código `404` con el mismo cuerpo que un usuario inexistente
- **AND** el usuario no cambia y no se registra auditoría de escritura

#### Scenario: Admin Regional gestiona usuarios dentro de su región
- **WHEN** un Admin Regional de `region_id: 2` crea un usuario cuyo funcionario pertenece a una escuela de `region_id: 2`
- **THEN** el servicio crea el usuario

#### Scenario: Admin País gestiona usuarios de cualquier ámbito
- **WHEN** un Admin País modifica un usuario de cualquier escuela o región
- **THEN** el servicio ejecuta la operación sin restricción de ámbito

#### Scenario: El listado de usuarios se limita al ámbito del actor
- **GIVEN** un Admin Escuela de `escuela_id: 5` y usuarios de las escuelas 5 y 10
- **WHEN** lista los usuarios
- **THEN** el resultado incluye solo usuarios cuyo funcionario pertenece a la escuela 5

#### Scenario: Admin Regional lista usuarios solo de su región
- **GIVEN** un Admin Regional de `region_id: 2` y usuarios de escuelas de las regiones 2 y 3
- **WHEN** lista los usuarios
- **THEN** el resultado incluye solo usuarios de escuelas de la región 2

#### Scenario: La consulta por id de un usuario fuera del ámbito responde 404
- **GIVEN** un Admin Escuela de `escuela_id: 5` y un usuario cuyo funcionario pertenece a `escuela_id: 10`
- **WHEN** envía `GET /api/usuarios/[id]` con el id de ese usuario
- **THEN** la respuesta tiene código `404`

#### Scenario: Admin País consulta cualquier usuario
- **WHEN** un Admin País envía `GET /api/usuarios/[id]` para un usuario de cualquier escuela
- **THEN** la respuesta tiene código `200`

### Requirement: Restablecer contraseña y cambiar estado respetan jerarquía y ámbito
Las operaciones de restablecer contraseña y de activar/desactivar un usuario SHALL aplicar las mismas verificaciones de jerarquía y ámbito que la creación, tomando como referencia el `nivel` del rol del usuario destino y el ámbito de su funcionario. El ámbito SHALL evaluarse primero: si el destino está fuera del ámbito del actor, la operación SHALL responder `404` (sin revelar su existencia). Si el destino está dentro del ámbito pero el actor no tiene jerarquía suficiente sobre él (según la regla de jerarquía de la creación: el rol del destino es más privilegiado que el del actor), el servicio SHALL rechazar la operación con un error de autorización (`403`).
(Previously: la falta de ámbito o de jerarquía sobre el destino se rechazaba siempre con error de autorización)

#### Scenario: Admin Escuela no restablece contraseña de un Admin País
- **GIVEN** un Admin Escuela de `escuela_id: 5` y un usuario con rol de `nivel: 1` cuyo funcionario pertenece a la escuela 5
- **WHEN** el Admin Escuela intenta restablecer la contraseña de ese usuario
- **THEN** el servicio rechaza la operación con error de autorización y la respuesta tiene código `403`

#### Scenario: Admin no desactiva usuarios fuera de su ámbito
- **WHEN** un Admin Regional de `region_id: 2` intenta desactivar un usuario cuyo funcionario pertenece a una escuela de `region_id: 3`
- **THEN** la respuesta tiene código `404` y el usuario no cambia

#### Scenario: Violación de jerarquía dentro del ámbito responde 403
- **GIVEN** un Admin Escuela de `escuela_id: 5` y un usuario con rol de `nivel: 2` cuyo funcionario pertenece a la escuela 5
- **WHEN** el Admin Escuela intenta cambiar el estado de ese usuario
- **THEN** la respuesta tiene código `403` y el usuario no cambia

### Requirement: Las rutas de usuarios mapean errores de autorización a 403
Los route handlers de gestión de usuarios SHALL propagar la sesión al servicio y SHALL responder con código HTTP `403` cuando el servicio rechace la operación por jerarquía insuficiente o, al crear, por un funcionario fuera del ámbito, sin filtrar detalles internos. Cuando el usuario destino de una ruta `[id]` esté fuera del ámbito del actor, SHALL responder `404` con el mismo cuerpo que un usuario inexistente.
(Previously: toda falta de jerarquía o ámbito se mapeaba a `403`, incluidas las rutas `[id]` con destino fuera del ámbito)

#### Scenario: La API responde 403 ante violación de jerarquía
- **WHEN** un Admin Regional autenticado envía una petición para crear un Admin País
- **THEN** la respuesta tiene código `403`
- **AND** no se crea el usuario

#### Scenario: La API responde 404 ante un destino fuera del ámbito
- **WHEN** un Admin Escuela de `escuela_id: 5` envía una petición de restablecer contraseña para un usuario cuyo funcionario pertenece a `escuela_id: 10`
- **THEN** la respuesta tiene código `404` con el mismo cuerpo que para un usuario inexistente
