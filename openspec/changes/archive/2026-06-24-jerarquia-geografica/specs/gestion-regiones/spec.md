## ADDED Requirements

### Requirement: Crear region
El sistema SHALL permitir a Admin País crear una región con nombre único.

#### Scenario: Admin País crea una región exitosamente
- **WHEN** un Admin País envía POST /api/regiones con `{ "nombre": "San José" }`
- **THEN** la región se crea y se responde con 201 y los datos de la región

#### Scenario: Admin Regional no puede crear regiones
- **WHEN** un Admin Regional (nivel 2) envía POST /api/regiones
- **THEN** el endpoint responde 403

#### Scenario: Nombre duplicado da error 409
- **WHEN** se crea una región con un nombre ya existente
- **THEN** el endpoint responde 409

### Requirement: Listar regiones
El sistema SHALL listar todas las regiones activas. Admin País ve todas; los demás roles ven solo las de su ámbito.

#### Scenario: Admin País lista todas las regiones
- **WHEN** un Admin País envía GET /api/regiones
- **THEN** responde 200 con un array de todas las regiones activas

### Requirement: Editar región
El sistema SHALL permitir a Admin País editar el nombre de una región.

#### Scenario: Admin País edita una región
- **WHEN** un Admin País envía PATCH /api/regiones/:id con `{ "nombre": "San José Centro" }`
- **THEN** la región se actualiza y se responde 200

#### Scenario: Editar región inexistente da 404
- **WHEN** se envía PATCH a /api/regiones/9999
- **THEN** responde 404

### Requirement: Desactivar región
El sistema SHALL permitir a Admin País desactivar una región (borrado lógico). Una región con escuelas activas NO se puede desactivar.

#### Scenario: Admin País desactiva una región sin escuelas
- **WHEN** un Admin País envía DELETE /api/regiones/:id
- **THEN** la región se desactiva y responde 200

#### Scenario: Desactivar región con escuelas da 409
- **WHEN** se intenta desactivar una región que tiene escuelas activas
- **THEN** responde 409
