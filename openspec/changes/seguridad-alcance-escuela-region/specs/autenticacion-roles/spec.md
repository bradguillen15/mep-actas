# Delta for autenticacion-roles

## MODIFIED Requirements

### Requirement: Autorización con verificación de nivel y ámbito
Cada endpoint protegido SHALL verificar sesión válida, nivel mínimo requerido y ámbito de acceso (escuela/región según el rol). La verificación SHALL ejecutarse en el servidor en cada petición. Al autorizar contra una `escuelaId`, el sistema SHALL resolver la región de esa escuela: un Admin País (nivel 1) SHALL quedar autorizado sin restricción; un Admin Regional (nivel 2) SHALL quedar autorizado solo cuando la región de la escuela coincida con su `regionId`; un Admin Escuela o Staff (niveles 3 y 4) SHALL quedar autorizado solo cuando la `escuelaId` coincida con la de su sesión. El registro de actas y de escaneos (`POST /api/actas`, `POST /api/escaneos`) SHALL permitir nivel mínimo 4 (Staff), aplicando la misma verificación de ámbito al `escuelaId` de la petición.
(Previously: la coincidencia de escuela se omitía para nivel ≤ 2, por lo que un Admin Regional podía operar sobre escuelas de otras regiones)

#### Scenario: Verificación de ámbito por escuela
- **WHEN** un Admin Escuela de escuela_id=5 intenta acceder a datos de escuela_id=10
- **THEN** la verificación de ámbito retorna no autorizado

#### Scenario: Admin Regional accede a escuelas de su región
- **WHEN** un Admin Regional de region_id=2 intenta acceder a una escuela de region_id=2
- **THEN** la verificación de ámbito retorna autorizado

#### Scenario: Admin Regional no accede a escuelas de otra región
- **WHEN** un Admin Regional de region_id=2 intenta acceder a una escuela de region_id=3
- **THEN** la verificación de ámbito retorna no autorizado

#### Scenario: Admin Regional no puede registrar un acta en otra región
- **WHEN** un Admin Regional de region_id=2 envía `POST /api/actas` con un `escuelaId` de una escuela de region_id=3
- **THEN** la petición responde `403` y no se crea el acta

#### Scenario: Admin País accede a cualquier escuela
- **WHEN** un Admin País intenta acceder a una escuela de cualquier región
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
