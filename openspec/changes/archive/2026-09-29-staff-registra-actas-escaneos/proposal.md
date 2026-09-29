## Why

El BRD (§6) define el rol Staff (nivel 4) como "Consulta y registro dentro de su escuela. No puede gestionar usuarios ni eliminar registros." Sin embargo, hoy `POST /api/actas` y `POST /api/escaneos` exigen `verificarRol(sesion, 3)`, lo que bloquea por completo a Staff: no puede registrar actas ni digitalizar folios, contradiciendo el permiso explícito del BRD y dejando sin uso real la mitad de su rol previsto.

## What Changes

- Relajar la verificación de nivel mínimo a `4` en `POST /api/actas` y `POST /api/escaneos`, permitiendo que Staff registre.
- Agregar verificación de **ámbito por escuela** en ambos endpoints: cuando el actor tiene `nivel > 3` (Staff), el `escuelaId` del cuerpo de la petición debe coincidir con `sesion.escuelaId`; de lo contrario, `403`. Los niveles 1–3 mantienen su alcance actual (sin esta restricción adicional, ya cubiertos por la jerarquía existente).
- Sin cambios en las rutas `DELETE` ni en la gestión de usuarios: Staff sigue sin poder eliminar registros ni gestionar cuentas, tal como exige el BRD.
- Sin cambios de esquema de base de datos.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `autenticacion-roles`: el requisito "Autorización con verificación de nivel y ámbito" se extiende — la verificación de ámbito por escuela, hoy solo descrita para Admin Escuela, ahora se aplica también a Staff en operaciones de creación (actas, escaneos), y el nivel mínimo permitido para registrar baja de 3 a 4.

## Impact

- `src/app/api/actas/route.ts` (POST): baja el nivel mínimo de 3 a 4, agrega verificación de ámbito por escuela.
- `src/app/api/escaneos/route.ts` (POST): baja el nivel mínimo de 3 a 4, agrega verificación de ámbito por escuela.
- Sin impacto en `DELETE /api/escaneos/[id]`, `PATCH /api/actas/[id]`, ni en endpoints de usuarios (permanecen en nivel ≤3).
- Pruebas: nuevas pruebas unitarias/E2E para Staff creando actas/escaneos en su propia escuela (permitido) y en otra escuela (denegado con 403).
