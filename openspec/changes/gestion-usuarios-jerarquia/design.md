## Context

El servicio `usuarios.servicio.ts` recibe la `SesionUsuario` pero solo la usa para auditoría; no aplica reglas de autorización propias. La protección actual vive en las rutas vía `verificarRol(sesion, 2)` ([autorizacion.servicio.ts](../../../src/server/auth/autorizacion.servicio.ts)), que valida nivel mínimo y ámbito **del actor** contra un `AmbitoVerificacion` dado, pero las rutas de usuarios no pasan ámbito ni comparan contra el usuario destino. Resultado: cualquier actor con `nivel <= 2` puede crear/gestionar usuarios de cualquier nivel y cualquier ámbito.

El esquema relevante: `usuarios(funcionario_id, rol_id, activo)`, `roles(id, nombre, nivel)`, `funcionarios(id, persona_id)`, `funcionario_escuela(funcionario_id, escuela_id)`, `escuelas(id, region_id)`. El ámbito de un funcionario se deriva de sus escuelas y de la región de esas escuelas.

## Goals / Non-Goals

**Goals:**
- Enforcement de jerarquía (no crear/gestionar niveles superiores al del actor) y de ámbito (región/escuela) en `crear`, `actualizarPassword` y `cambiarEstado`.
- Reusar `verificarRol`/`AmbitoVerificacion` existentes en lugar de inventar un mecanismo paralelo.
- Pruebas entre roles (permitido y denegado) en servicio y E2E.
- UI de administración de usuarios que solo ofrezca roles/ámbitos permitidos.

**Non-Goals:**
- Cambios de esquema de base de datos.
- Auto-registro o recuperación de contraseña por el propio usuario (sigue siendo por invitación).
- Rediseño del modelo de roles o de la auditoría.
- Gestión de funcionarios/personas (se asume el funcionario ya existe; aquí se gestiona la cuenta de usuario).

## Decisions

### Decisión 1: La autorización de jerarquía/ámbito vive en el servicio, no solo en la ruta
El servicio `usuarios.servicio` recibirá una función de autorización (inyectada) y validará jerarquía + ámbito antes de mutar. Rationale: las reglas dependen de datos del usuario destino (nivel del rol, escuelas del funcionario) que el servicio ya consulta; ponerlas en la ruta duplicaría queries y dejaría el servicio inseguro por defecto.
- *Alternativa considerada:* validar solo en la ruta. Rechazada: el servicio quedaría explotable desde otros llamadores y las pruebas de servicio no cubrirían la regla.

### Decisión 2: Resolver el nivel del rol destino y el ámbito del funcionario destino mediante el repositorio
Se agregan lecturas: `obtenerNivelDeRol(rolId)` y `obtenerAmbitoDeFuncionario(funcionarioId)` → `{ escuelaIds: number[], regionIds: number[] }`. La regla de jerarquía compara `nivelRolDestino >= sesion.nivel`. La regla de ámbito verifica que alguna escuela/región del funcionario destino caiga dentro del ámbito del actor (reusando la semántica de `verificarRol` con `AmbitoVerificacion`).
- *Alternativa:* almacenar denormalizado el ámbito en `usuarios`. Rechazada: sin cambios de esquema y un funcionario puede pertenecer a varias escuelas.

### Decisión 3: Reusar `verificarRol` para el chequeo de ámbito del actor
Para cada escuela/región candidata del funcionario destino se invoca `verificarRol(sesion, sesion.nivel, { escuelaId, regionId })`; basta con que una combinación resulte autorizada (Admin País siempre pasa por la rama `nivel === 1`). La jerarquía de nivel del **rol destino** se valida aparte porque `verificarRol` valida el nivel del **actor**, no el del objetivo.

### Decisión 4: Errores de autorización tipados; las rutas los mapean a 403
El servicio lanzará un `Error` con `name = "ForbiddenError"` ante violación de jerarquía/ámbito. Las rutas capturan `ForbiddenError` → `403`, consistente con el manejo actual de `ConflictError` → `409` y `NotFoundError` → `404`.

### Decisión 5: La UI deriva las opciones permitidas del rol en sesión
El selector de rol del formulario filtra a `nivel >= sesion.nivel`; el ámbito (escuela/región) se prefija/limita según el rol. El backend sigue siendo la autoridad: la UI solo evita ofrecer acciones inválidas. La entrada al menú se muestra para `nivel <= 3` (reusa el patrón `adminOnly` del `Sidebar`).

## Risks / Trade-offs

- **Funcionario con múltiples escuelas/regiones cruzando ámbitos** → se autoriza si *alguna* de sus escuelas cae en el ámbito del actor; se documenta como comportamiento intencional (alineado a que un funcionario puede pertenecer a varias escuelas, BRD §5.3).
- **Queries adicionales por operación (nivel del rol + ámbito del funcionario)** → impacto mínimo (lecturas indexadas por PK/FK); aceptable frente a la correctitud de seguridad.
- **Divergencia UI/serverside** → mitigado manteniendo el backend como única autoridad y agregando pruebas que verifiquen el 403 aunque la UI lo permitiera.
- **Ámbito de sesión = primera escuela/región del funcionario (Decisión 6)** → un Admin Regional/Escuela cuyo funcionario pertenece a varias escuelas/regiones queda limitado, para efectos de `verificarRol`, a la primera. No afecta a Admin País (sin ámbito) ni a la validación de ámbito del *destino* en `usuarios.servicio` (que sí recorre todas las escuelas del funcionario objetivo). Aceptable para el piloto de una escuela; revisar al expandir a Fase 2 (multi-escuela por funcionario con rol regional).

## Migration Plan

Sin migración de datos. Cambio aditivo de comportamiento (más restrictivo). Despliegue estándar; rollback = revertir el commit. Verificar que el seed/admin inicial (Admin País) siga pudiendo crear todos los niveles tras el cambio.

### Decisión 6: El ámbito del actor se resuelve en el login, no en cada petición

Una auditoría de seguridad (2026-07-08) encontró que `SesionUsuario.escuelaId`/`regionId` nunca se poblaban: el callback `jwt` de NextAuth solo copiaba `usuarioId`, `rolId`, `nivel`, `funcionarioId`. Como consecuencia, tanto `verificarRol(..., ambito)` (capability `autenticacion-roles`) como `dentroDeAmbito` (esta capability) evaluaban siempre `undefined`, y las pruebas solo pasaban porque construyen `SesionUsuario` manualmente. En producción esto era **doblemente incorrecto**: sub-restrictivo hacia otras escuelas (fuga de datos vía `escuelaId` de query string sin validar) y sobre-restrictivo hacia la propia gestión de usuarios (ningún Admin Regional/Escuela real podía pasar el chequeo de ámbito).

Se decide resolver `obtenerAmbitoDeFuncionario(funcionarioId)` (ya existente, sección 2) dentro del callback `jwt` en el primer login y persistir `escuelaId`/`regionId` en el token. Si el funcionario pertenece a varias escuelas/regiones, se usa la primera como ámbito "propio" de la sesión (limitación conocida; ver Risks). Esto no cambia el modelo de datos ni el contrato de `verificarRol`/`dentroDeAmbito`, solo corrige que la sesión llegue con los datos que esas funciones siempre esperaron recibir.

- *Alternativa considerada:* resolver el ámbito en cada petición desde la BD en vez del JWT. Rechazada por ahora: agrega una consulta por request a todos los endpoints protegidos; el JWT ya se re-firma en cada login y la ventana de staleness (cambio de escuela de un funcionario sin volver a iniciar sesión) se considera aceptable para el piloto.

## Open Questions

- ¿La UI de gestión de usuarios debe permitir además seleccionar/crear el funcionario, o asume un funcionario existente seleccionable? (Asunción actual: funcionario existente; crear funcionario queda fuera de alcance.)
