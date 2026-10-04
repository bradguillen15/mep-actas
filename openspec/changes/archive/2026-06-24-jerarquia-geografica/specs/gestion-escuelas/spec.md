## ADDED Requirements

### Requirement: Crear escuela
El sistema SHALL permitir a Admin País y Admin Regional crear escuelas. Admin Regional solo puede crear escuelas dentro de su región. La escuela requiere `region_id`, `codigo_mep` (único) y `nombre`.

#### Scenario: Admin País crea escuela en cualquier región
- **WHEN** un Admin País envía POST /api/escuelas con `{ "region_id": 1, "codigo_mep": "MEP-001", "nombre": "Escuela Central" }`
- **THEN** la escuela se crea y responde 201

#### Scenario: Admin Regional crea escuela en su región
- **WHEN** un Admin Regional de region_id=1 envía POST /api/escuelas con `{ "region_id": 1, "codigo_mep": "MEP-002", "nombre": "Escuela Regional" }`
- **THEN** la escuela se crea y responde 201

#### Scenario: Admin Regional crea escuela fuera de su región da 403
- **WHEN** un Admin Regional de region_id=1 envía POST /api/escuelas con `{ "region_id": 2, ... }`
- **THEN** responde 403

#### Scenario: Código MEP duplicado da 409
- **WHEN** se crea una escuela con un codigo_mep ya existente
- **THEN** responde 409

### Requirement: Listar escuelas
El sistema SHALL listar escuelas. Admin País ve todas. Admin Regional ve las de su región. Admin Escuela y Staff ven solo su escuela. Soporta filtro opcional por `region_id`.

#### Scenario: Admin País lista todas las escuelas
- **WHEN** un Admin País envía GET /api/escuelas
- **THEN** responde 200 con array de escuelas

#### Scenario: Filtrar escuelas por región
- **WHEN** se envía GET /api/escuelas?region_id=1
- **THEN** responde solo las escuelas de región_id=1

### Requirement: Editar escuela
El sistema SHALL permitir editar nombre y código MEP de una escuela. Admin País edita cualquier escuela; Admin Regional solo las de su región.

#### Scenario: Admin Regional edita escuela de su región
- **WHEN** un Admin Regional de region_id=1 envía PATCH /api/escuelas/:id con datos de escuela de región 1
- **THEN** responde 200 con escuela actualizada

#### Scenario: Admin Regional edita escuela fuera de su región da 403
- **WHEN** un Admin Regional de region_id=1 envía PATCH a escuela de región 2
- **THEN** responde 403

### Requirement: Desactivar escuela (borrado lógico)
El sistema SHALL permitir desactivar una escuela. Una escuela con actas activas NO se puede desactivar.

#### Scenario: Admin País desactiva escuela sin actas
- **WHEN** DELETE /api/escuelas/:id por Admin País
- **THEN** la escuela se desactiva y responde 200

#### Scenario: Desactivar escuela con actas da 409
- **WHEN** se intenta desactivar una escuela que tiene actas
- **THEN** responde 409
