# gestion-usuarios Specification

## Purpose
Define la gestión de usuarios por invitación respetando la jerarquía de roles y el ámbito geográfico del actor.
## Requirements
### Requirement: Creación de usuarios respeta la jerarquía de niveles
Al crear un usuario, el servicio SHALL verificar que el `nivel` del rol solicitado para el nuevo usuario sea **igual o mayor** (igual nivel o inferior en privilegio) que el `nivel` del usuario en sesión. Si el rol solicitado tiene un `nivel` menor (más privilegiado) que el del actor, el servicio SHALL rechazar la operación con un error de autorización y NO SHALL crear el usuario.

#### Scenario: Admin Regional no puede crear Admin País
- **WHEN** un usuario en sesión con `nivel: 2` intenta crear un usuario con un rol de `nivel: 1`
- **THEN** el servicio rechaza la operación con error de autorización
- **AND** no se inserta ningún usuario nuevo

#### Scenario: Admin Regional puede crear Admin Escuela
- **WHEN** un usuario en sesión con `nivel: 2` intenta crear un usuario con un rol de `nivel: 3` dentro de su ámbito
- **THEN** el servicio crea el usuario

#### Scenario: Admin País puede crear cualquier nivel
- **WHEN** un usuario en sesión con `nivel: 1` intenta crear un usuario con un rol de `nivel: 1`
- **THEN** el servicio crea el usuario

### Requirement: Gestión de usuarios respeta el ámbito de región/escuela
Al crear, restablecer contraseña o cambiar el estado de un usuario, el servicio SHALL verificar que el funcionario destino pertenezca al ámbito del usuario en sesión: un Admin Regional (`nivel: 2`) solo SHALL gestionar usuarios cuyo funcionario pertenece a una escuela de su `region_id`; un Admin Escuela (`nivel: 3`) solo SHALL gestionar usuarios cuyo funcionario pertenece a su `escuela_id`; un Admin País (`nivel: 1`) NO SHALL tener restricción de ámbito. Si el destino está fuera del ámbito, el servicio SHALL rechazar la operación con un error de autorización.

#### Scenario: Admin Escuela no gestiona usuarios de otra escuela
- **WHEN** un Admin Escuela de `escuela_id: 5` intenta crear o modificar un usuario cuyo funcionario pertenece a `escuela_id: 10`
- **THEN** el servicio rechaza la operación con error de autorización

#### Scenario: Admin Regional gestiona usuarios dentro de su región
- **WHEN** un Admin Regional de `region_id: 2` crea un usuario cuyo funcionario pertenece a una escuela de `region_id: 2`
- **THEN** el servicio crea el usuario

#### Scenario: Admin País gestiona usuarios de cualquier ámbito
- **WHEN** un Admin País modifica un usuario de cualquier escuela o región
- **THEN** el servicio ejecuta la operación sin restricción de ámbito

### Requirement: Restablecer contraseña y cambiar estado respetan jerarquía y ámbito
Las operaciones de restablecer contraseña y de activar/desactivar un usuario SHALL aplicar las mismas verificaciones de jerarquía y ámbito que la creación, tomando como referencia el `nivel` del rol del usuario destino y el ámbito de su funcionario. Si el actor no tiene jerarquía o ámbito suficiente sobre el destino, el servicio SHALL rechazar la operación con un error de autorización.

#### Scenario: Admin Escuela no restablece contraseña de un Admin País
- **WHEN** un Admin Escuela intenta restablecer la contraseña de un usuario con rol de `nivel: 1`
- **THEN** el servicio rechaza la operación con error de autorización

#### Scenario: Admin no desactiva usuarios fuera de su ámbito
- **WHEN** un Admin Regional de `region_id: 2` intenta desactivar un usuario cuyo funcionario pertenece a una escuela de `region_id: 3`
- **THEN** el servicio rechaza la operación con error de autorización

### Requirement: Las rutas de usuarios mapean errores de autorización a 403
Los route handlers de gestión de usuarios SHALL propagar la sesión al servicio y SHALL responder con código HTTP `403` cuando el servicio rechace la operación por jerarquía o ámbito insuficiente, sin filtrar detalles internos.

#### Scenario: La API responde 403 ante violación de jerarquía
- **WHEN** un Admin Regional autenticado envía una petición para crear un Admin País
- **THEN** la respuesta tiene código `403`
- **AND** no se crea el usuario

### Requirement: Las rutas de usuarios permiten administradores hasta nivel 3
Los route handlers de gestión de usuarios SHALL permitir el acceso a usuarios con `nivel <= 3` (BRD §6: el Admin Escuela crea usuarios staff de su escuela), delegando en el servicio las verificaciones de jerarquía y ámbito. Un usuario Staff (`nivel: 4`) NO SHALL acceder a ninguna operación de gestión de usuarios, y una petición sin sesión SHALL recibir `401` (sin auto-registro).

#### Scenario: Admin Escuela crea un Staff de su escuela vía API
- **WHEN** un Admin Escuela autenticado envía `POST /api/usuarios` con un rol de `nivel: 4` y un funcionario de su escuela
- **THEN** la respuesta tiene código `201` y el usuario se crea

#### Scenario: Staff recibe 403 en la API de usuarios
- **WHEN** un usuario Staff (`nivel: 4`) autenticado envía cualquier petición a `/api/usuarios`
- **THEN** la respuesta tiene código `403`

#### Scenario: Sin sesión la API responde 401
- **WHEN** una petición sin sesión llega a `/api/usuarios`
- **THEN** la respuesta tiene código `401`

### Requirement: UI de gestión de usuarios para administradores
El sistema SHALL ofrecer una pantalla de gestión de usuarios accesible solo para usuarios administradores (`nivel <= 3`), que permita listar usuarios, invitar/crear un usuario, restablecer su contraseña y activar/desactivarlo. La UI SHALL ofrecer únicamente las opciones de rol y ámbito permitidas por el rol del usuario en sesión y NO SHALL ofrecer auto-registro.

#### Scenario: Un administrador ve la sección de usuarios
- **WHEN** un usuario con `nivel <= 3` navega a la gestión de usuarios
- **THEN** la pantalla lista los usuarios y ofrece las acciones de crear, restablecer contraseña y activar/desactivar

#### Scenario: Staff no accede a la gestión de usuarios
- **WHEN** un usuario con `nivel: 4` (Staff) intenta acceder a la gestión de usuarios
- **THEN** la sección no está disponible para ese usuario

#### Scenario: El selector de rol no ofrece niveles superiores al del actor
- **WHEN** un Admin Regional (`nivel: 2`) abre el formulario de creación de usuario
- **THEN** el selector de rol solo ofrece roles de `nivel >= 2` (su mismo nivel o inferiores)

### Requirement: La pantalla de gestión de usuarios es responsiva
La pantalla de gestión de usuarios SHALL adaptarse al tamaño del viewport sin desplazamiento horizontal de la página: en pantallas pequeñas (menores a `768px`) SHALL presentar los usuarios como tarjetas apiladas con las mismas acciones (restablecer contraseña, activar/desactivar) y el encabezado apilado en columna; en pantallas medianas o mayores SHALL presentar la tabla completa. La navegación lateral SHALL plegarse a un menú desplegable accesible en pantallas pequeñas.

#### Scenario: Vista móvil presenta tarjetas con las mismas acciones
- **WHEN** un administrador abre la gestión de usuarios en un viewport menor a `768px`
- **THEN** los usuarios se presentan como tarjetas apiladas con correo, funcionario, rol y estado
- **AND** cada tarjeta ofrece las acciones de restablecer contraseña y activar/desactivar
- **AND** la tabla no es visible

#### Scenario: Vista de escritorio presenta la tabla completa
- **WHEN** un administrador abre la gestión de usuarios en un viewport de `768px` o mayor
- **THEN** los usuarios se presentan en la tabla con paginación y las tarjetas móviles no son visibles

#### Scenario: La navegación se pliega en pantallas pequeñas
- **WHEN** un administrador usa la aplicación en un viewport menor a `768px`
- **THEN** la barra lateral queda oculta y se ofrece un botón accesible que abre el menú de navegación

