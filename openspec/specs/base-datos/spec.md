## ADDED Requirements

### Requirement: Esquema Drizzle con 15 tablas en español
La base de datos SHALL definirse con Drizzle ORM sobre SQLite/libSQL. Los nombres de tablas y columnas SHALL estar en español, según el modelo de datos del BRD §10.

#### Scenario: Las tablas del esquema existen
- **WHEN** se inspecciona `src/db/esquema.ts`
- **THEN** existen las tablas: `regiones`, `escuelas`, `tipos_acta`, `actas`, `acta_estudiantes`, `personas`, `estudiantes`, `escaneos`, `acta_escaneos`, `funcionarios`, `funcionario_escuela`, `acta_firmantes`, `roles`, `usuarios`, `auditoria`

### Requirement: Cliente de base de datos solo-servidor
El cliente Turso/Drizzle SHALL vivir en `src/db/cliente.ts` y SHALL exportar una instancia de Drizzle. Nunca SHALL importarse desde código de cliente (navegador).

#### Scenario: El cliente de base de datos existe
- **WHEN** se importa `src/db/cliente.ts`
- **THEN** exporta una función `clienteDb` que retorna una instancia de drizzle

### Requirement: Claves foráneas declaradas
Todas las relaciones entre tablas SHALL declarar claves foráneas explícitas en el esquema Drizzle.

#### Scenario: Las claves foráneas están definidas
- **WHEN** se inspecciona `src/db/esquema.ts`
- **THEN** `escuelas.region_id` referencia `regiones.id`, `actas.escuela_id` referencia `escuelas.id`, y toda FK del BRD §10 está declarada

### Requirement: Índices para búsqueda
Las columnas usadas en búsquedas frecuentes SHALL tener índices declarados desde el inicio.

#### Scenario: Los índices críticos existen
- **WHEN** se inspecciona `src/db/esquema.ts`
- **THEN** existen índices en `personas.identificacion`, `actas.escuela_id`, `escaneos.escuela_id`

### Requirement: Migración inicial generable
`drizzle.config.ts` SHALL estar configurado para generar migraciones con `drizzle-kit`.

#### Scenario: La migración se genera sin errores
- **WHEN** se ejecuta `npx drizzle-kit generate`
- **THEN** se crea un archivo de migración en `drizzle/` sin errores
