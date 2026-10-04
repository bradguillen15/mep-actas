## ADDED Requirements

### Requirement: Cliente Cloudflare R2 solo-servidor
El cliente de R2 SHALL inicializarse con credenciales desde variables de entorno (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`). SHALL vivir en `src/server/almacenamiento/r2.cliente.ts`. Nunca SHALL exponerse al navegador.

#### Scenario: El cliente R2 se inicializa con variables de entorno
- **WHEN** se importa `r2.cliente.ts` con las variables de entorno definidas
- **THEN** retorna una instancia de S3Client configurada

#### Scenario: Error si faltan variables de entorno
- **WHEN** se importa `r2.cliente.ts` sin variables de entorno
- **THEN** lanza un error claro indicando qué variable falta

### Requirement: URLs firmadas para lectura
El sistema SHALL generar URLs firmadas (presigned GET) de corta duración para leer escaneos. El tiempo de vida SHALL ser configurable con valor por defecto de 5 minutos.

#### Scenario: Se genera una URL firmada de lectura
- **WHEN** se llama a `generarUrlLectura(clave, 300)`
- **THEN** retorna una URL firmada de `getObject` con expiración de 300 segundos

### Requirement: URLs firmadas para subida con validación de tipo
El sistema SHALL generar URLs firmadas (presigned PUT) para subir escaneos, validando el Content-Type permitido. Solo SHALL permitir `image/jpeg`, `image/png` y `application/pdf`.

#### Scenario: Se genera URL de subida para JPEG
- **WHEN** se llama a `generarUrlSubida(clave, 300, "image/jpeg")`
- **THEN** retorna una URL firmada de `putObject` con Content-Type restringido a `image/jpeg`

### Requirement: Key convention anti-path-traversal
Las claves de objeto en R2 SHALL seguir la convención `escaneos/{escuela_id}/{tomo}/{folio}.{extension}`. La función `construirClave` SHALL sanitizar los parámetros para prevenir path traversal.

#### Scenario: La clave generada sigue la convención
- **WHEN** se llama a `construirClave(5, 3, 12, "jpg")`
- **THEN** retorna `"escaneos/5/3/12.jpg"`

#### Scenario: La clave rechaza parámetros maliciosos
- **WHEN** se llama a `construirClave(5, "../etc", 12, "jpg")`
- **THEN** lanza un error o sanitiza eliminando caracteres peligrosos
