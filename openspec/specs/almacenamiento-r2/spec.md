# almacenamiento-r2 Specification

## Purpose
Define el almacenamiento de escaneos en Cloudflare R2 con acceso exclusivo desde el servidor y URLs firmadas.

## Requirements

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

### Requirement: Modo de almacenamiento local para desarrollo
El sistema SHALL usar un adaptador de almacenamiento en disco (directorio `.almacenamiento-local/`, ignorado por git) solo cuando `NODE_ENV` sea `development` y las credenciales de R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) no estén configuradas. En cualquier otro caso SHALL usar R2. Las rutas `GET` y `PUT` de `/api/almacenamiento-local/{clave}` SHALL exigir sesión, validar la clave con la convención de `construirClave`, verificar el ámbito de la escuela de la clave, aceptar solo `image/jpeg`, `image/png` y `application/pdf`, y limitar el tamaño a 10 MB. La semilla local SHALL generar una imagen PNG de marcador por cada folio sembrado.

#### Scenario: Desarrollo sin R2 usa el disco local
- **WHEN** `NODE_ENV` es `development` y faltan las variables de R2
- **THEN** las URLs de lectura y subida apuntan a `/api/almacenamiento-local/{clave}` y los archivos se guardan en `.almacenamiento-local/`

#### Scenario: Desarrollo con R2 configurado usa R2
- **WHEN** `NODE_ENV` es `development` y las credenciales de R2 están definidas
- **THEN** se usa el adaptador de R2 con URLs firmadas

#### Scenario: Producción sin variables de R2 sigue fallando
- **WHEN** `NODE_ENV` es `production` y faltan las variables de R2
- **THEN** se usa el adaptador de R2 y la operación lanza un error indicando qué variable falta, sin recurrir al disco local

#### Scenario: Las rutas locales no existen fuera del modo local
- **WHEN** se solicita `GET` o `PUT` a `/api/almacenamiento-local/{clave}` y el modo local no está activo
- **THEN** responde 404 sin leer ni escribir archivos

#### Scenario: Las rutas locales rechazan claves peligrosas
- **WHEN** la clave contiene `..`, no sigue la convención `escaneos/{escuela_id}/{tomo}/{folio}.{extension}` o la extensión no está permitida
- **THEN** responde 400 sin tocar el disco

#### Scenario: Las rutas locales respetan sesión y ámbito
- **WHEN** no hay sesión, o la escuela de la clave está fuera del ámbito del usuario
- **THEN** responde 401 o 403 respectivamente

#### Scenario: La semilla escribe marcadores locales
- **WHEN** se ejecuta `pnpm db:sembrar` o `pnpm db:reiniciar`
- **THEN** cada folio de cada acta sembrada tiene un escaneo con formato `png` y su imagen "Tomo N · Folio F" en `.almacenamiento-local/`, y `db:reiniciar` vacía antes ese directorio
