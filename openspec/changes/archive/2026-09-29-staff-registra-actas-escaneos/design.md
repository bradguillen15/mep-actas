## Context

`POST /api/actas` ([route.ts](../../../src/app/api/actas/route.ts)) y `POST /api/escaneos` ([route.ts](../../../src/app/api/escaneos/route.ts)) llaman a `verificarRol(sesion, 3)`, bloqueando a Staff (nivel 4). `verificarRol` (`src/server/auth/autorizacion.servicio.ts`) ya soporta un tercer parámetro `AmbitoVerificacion { escuelaId?, regionId? }` que compara contra `sesion.escuelaId`/`sesion.regionId` cuando `sesion.nivel > 2`. Desde una sesión reciente en este mismo proyecto, `sesion.escuelaId`/`regionId` ya se resuelven de forma real en el login (antes siempre eran `undefined`), así que este mecanismo de ámbito hoy sí funciona en producción, no solo en pruebas.

El patrón de "resolver el recurso, luego validar ámbito contra su escuela" ya se usó en `DELETE /api/escaneos/[id]` (creación del escaneo, luego `verificarRol(sesion, 3, { escuelaId: existente.escuelaId })`). Para `POST`, el "recurso" es el `escuelaId` que viene en el cuerpo de la petición, no uno ya existente en BD — no hace falta una consulta previa.

## Goals / Non-Goals

**Goals:**
- Bajar el nivel mínimo a 4 en `POST /api/actas` y `POST /api/escaneos`.
- Verificar que, cuando el actor es Staff (nivel 4) o Admin Escuela (nivel 3), el `escuelaId` del cuerpo coincida con `sesion.escuelaId`.
- Reusar `verificarRol` con `AmbitoVerificacion` — no crear un mecanismo paralelo.

**Non-Goals:**
- No se tocan `DELETE`, `PATCH` ni endpoints de usuarios (siguen en nivel ≤3).
- No se cambia el modelo de datos ni el contrato de `verificarRol`.
- No se resuelve aquí la vinculación acta↔escaneo (`acta_escaneos`) ni otras brechas de conformidad BRD identificadas por separado; quedan fuera de alcance de este change.

## Decisions

### Decisión 1: Verificar ámbito ANTES de tocar el servicio, usando el `escuelaId` del cuerpo
En ambos route handlers, tras `verificarRol(sesion, 4)` (chequeo de nivel), se agrega `verificarRol(sesion, 4, { escuelaId: cuerpo.escuelaId })` antes de invocar el servicio. Como `dentroDeAmbito` en `autorizacion.servicio.ts` solo aplica el chequeo de escuela cuando `sesion.nivel > 2`, Admin País (1) y Admin Regional (2) no se ven afectados por esta validación adicional — su alcance ya lo cubre la jerarquía existente.
- *Alternativa considerada:* validar el ámbito dentro del servicio (`actas.servicio.ts` / `escaneos.servicio.ts`), como se hizo para jerarquía de usuarios en `gestion-usuarios-jerarquia`. Rechazada aquí: el servicio de actas/escaneos no tiene hoy ninguna lógica de autorización (vive solo en la ruta), y la ruta ya conoce `escuelaId` del cuerpo sin necesitar una consulta adicional — mover la regla al servicio no aporta valor y desvía del alcance mínimo de este change.

### Decisión 2: `escuelaId` sigue siendo obligatorio en el cuerpo (sin autocompletar desde la sesión)
No se autocompleta `escuelaId` desde `sesion.escuelaId` cuando falta en el cuerpo — se mantiene el contrato actual del API (el cliente siempre envía `escuelaId` explícito). Si falta, la validación de tipo/negocio existente en el servicio ya lo rechaza.
- *Alternativa:* inferir `escuelaId` automáticamente para Staff. Rechazada por ahora: cambiaría el contrato de la API y el frontend ya envía `escuelaId` explícitamente en los formularios de creación (ver `useEscuelaActual`).

## Risks / Trade-offs

- **Admin Regional (nivel 2) sigue sin restricción de escuela en estos dos endpoints** → ya era el comportamiento previo (solo nivel 3 estaba bloqueado por completo); no lo empeora ni lo arregla este change, es una brecha ya conocida y documentada por separado (auditoría BRD) que no se resuelve aquí para mantener el alcance acotado.
- **Mensajes 403 genéricos** → se reusa el mismo formato de error ya usado en `DELETE /api/escaneos/[id]` ("No tiene permisos para..."), consistente con el resto del API.

## Migration Plan

Sin migración de datos. Cambio de comportamiento aditivo para Staff (antes bloqueado, ahora permitido dentro de su escuela) y restrictivo solo para el caso antes no contemplado (Staff/Admin Escuela intentando registrar en otra escuela, que antes tampoco funcionaba porque Staff no podía llegar ni siquiera al nivel mínimo). Despliegue estándar; rollback = revertir el commit.
