## MODIFIED Requirements

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
