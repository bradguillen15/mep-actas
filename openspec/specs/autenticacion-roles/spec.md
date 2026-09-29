# autenticacion-roles Specification

## Purpose
Define la autenticación con NextAuth y la autorización por nivel jerárquico y ámbito geográfico.
## Requirements
### Requirement: Autenticación con NextAuth y JWT en httpOnly cookies
El sistema SHALL usar NextAuth con estrategia JWT. El token JWT SHALL almacenarse en cookies httpOnly, Secure y SameSite=Lax. El rol del usuario (`rol_id`, `nivel`) SHALL viajar en el token.

#### Scenario: Las cookies JWT son httpOnly
- **WHEN** se configura NextAuth
- **THEN** las cookies de sesión usan `httpOnly: true`, `secure: true`, `sameSite: "lax"`

#### Scenario: El rol viaja en el token JWT
- **WHEN** un usuario inicia sesión
- **THEN** el token JWT contiene los campos `rol_id`, `nivel` y `usuario_id`

### Requirement: Jerarquía de roles por nivel
Los roles SHALL ser jerárquicos por nivel numérico: Admin País (1), Admin Regional (2), Admin Escuela (3), Staff (4). Un nivel menor (más alto) SHALL tener todos los permisos de los niveles mayores.

#### Scenario: Admin País puede actuar como Admin Regional
- **WHEN** un usuario con `nivel: 1` intenta una acción que requiere `nivelMinimo: 2`
- **THEN** la verificación de rol retorna autorizado

#### Scenario: Staff no puede actuar como Admin Escuela
- **WHEN** un usuario con `nivel: 4` intenta una acción que requiere `nivelMinimo: 3`
- **THEN** la verificación de rol retorna no autorizado

### Requirement: Autorización con verificación de nivel y ámbito
Cada endpoint protegido SHALL verificar sesión válida, nivel mínimo requerido y ámbito de acceso (escuela/región según el rol). La verificación SHALL ejecutarse en el servidor en cada petición. El registro de actas y de escaneos (`POST /api/actas`, `POST /api/escaneos`) SHALL permitir nivel mínimo 4 (Staff), validando que el `escuelaId` de la petición coincida con el `escuelaId` de la sesión del actor cuando su nivel sea mayor a 2.

#### Scenario: Verificación de ámbito por escuela
- **WHEN** un Admin Escuela de escuela_id=5 intenta acceder a datos de escuela_id=10
- **THEN** la verificación de ámbito retorna no autorizado

#### Scenario: Admin Regional accede a escuelas de su región
- **WHEN** un Admin Regional de region_id=2 intenta acceder a una escuela de region_id=2
- **THEN** la verificación de ámbito retorna autorizado

#### Scenario: Staff registra un acta en su propia escuela
- **WHEN** un Staff (nivel 4) de escuela_id=5 envía `POST /api/actas` con `escuelaId: 5`
- **THEN** la petición se autoriza y el acta se crea

#### Scenario: Staff no puede registrar un acta en otra escuela
- **WHEN** un Staff (nivel 4) de escuela_id=5 envía `POST /api/actas` con `escuelaId: 10`
- **THEN** la petición responde `403` y no se crea el acta

#### Scenario: Staff registra un escaneo en su propia escuela
- **WHEN** un Staff (nivel 4) de escuela_id=5 envía `POST /api/escaneos` con `escuelaId: 5`
- **THEN** la petición se autoriza y se prepara la subida

#### Scenario: Staff no puede registrar un escaneo en otra escuela
- **WHEN** un Staff (nivel 4) de escuela_id=5 envía `POST /api/escaneos` con `escuelaId: 10`
- **THEN** la petición responde `403` y no se crea el escaneo

### Requirement: Rate limiting en login para mitigar fuerza bruta
El endpoint de inicio de sesión SHALL tener un rate limiter en memoria con ventana deslizante. El límite SHALL ser configurable via `LOGIN_RATE_LIMIT_MAX` (default 5 intentos por minuto por IP). Al exceder el límite SHALL responder `429 Too Many Requests` con header `Retry-After`.

#### Scenario: Login rate limiter bloquea después de N intentos
- **WHEN** una IP excede `LOGIN_RATE_LIMIT_MAX` intentos en un minuto
- **THEN** el endpoint responde con código 429 y header `Retry-After`

### Requirement: Módulos SRP para autenticación
La lógica de autenticación SHALL dividirse en tres archivos con responsabilidades separadas: `auth.config.ts` (config de NextAuth), `sesion.servicio.ts` (obtención de sesión), `autorizacion.servicio.ts` (verificación de rol + ámbito).

#### Scenario: Los tres módulos de auth existen
- **WHEN** se inspecciona `src/server/auth/`
- **THEN** existen `auth.config.ts`, `sesion.servicio.ts`, `autorizacion.servicio.ts` y `tipos.ts`

