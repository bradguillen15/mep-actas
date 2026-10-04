## 0. Preparación

- [x] 0.1 Decisión del usuario: no crear rama nueva — se continúa sobre `feat/gestion-usuarios-jerarquia` (ya tiene trabajo relacionado de la misma sesión de auditoría). El trabajo pendiente previo se commiteó por separado antes de iniciar este change.
- [x] 0.2 Confirmar árbol de trabajo limpio antes de empezar (`git status` sin cambios pendientes).

## 1. Backend: `POST /api/actas` permite a Staff dentro de su escuela

- [x] 1.1 Escribir prueba que falle en `src/app/api/actas/__tests__/route.test.ts` (nuevo archivo): un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/actas` con `escuelaId: 5` recibe `201` (o al menos no `403`).
- [x] 1.2 Escribir prueba que falle: un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/actas` con `escuelaId: 10` recibe `403` y el acta no se crea.
- [x] 1.3 Implementar en `src/app/api/actas/route.ts`: bajar `verificarRol(sesion, 3)` a `verificarRol(sesion, 4)` en `POST`, y agregar `verificarRol(sesion, 4, { escuelaId: json.escuelaId })` inmediatamente después, devolviendo `403` si no autoriza.
- [x] 1.4 Poner en verde las pruebas de 1.1 y 1.2.

## 2. Backend: `POST /api/escaneos` permite a Staff dentro de su escuela

- [x] 2.1 Escribir prueba que falle en `src/app/api/escaneos/__tests__/route.test.ts` (nuevo archivo): un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/escaneos` con `escuelaId: 5` recibe `201`.
- [x] 2.2 Escribir prueba que falle: un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/escaneos` con `escuelaId: 10` recibe `403` y no se llama `prepararSubida`.
- [x] 2.3 Implementar en `src/app/api/escaneos/route.ts`: bajar `verificarRol(sesion, 3)` a `verificarRol(sesion, 4)` en `POST`, y agregar `verificarRol(sesion, 4, { escuelaId: cuerpo.escuelaId })` inmediatamente después, devolviendo `403` si no autoriza.
- [x] 2.4 Poner en verde las pruebas de 2.1 y 2.2.

## 3. Confirmar que niveles 1-3 no se ven afectados

- [x] 3.1 Escribir/confirmar prueba: Admin Escuela (nivel 3) sigue pudiendo crear actas/escaneos en su propia escuela (regresión).
- [x] 3.2 Escribir/confirmar prueba: Admin País (nivel 1) y Admin Regional (nivel 2) siguen sin restricción de ámbito en estos dos endpoints (regresión, ya que `dentroDeAmbito` solo aplica el chequeo de escuela cuando `sesion.nivel > 2`).

## 4. Ejecutar pruebas (Vitest) (OBLIGATORIO)

- [x] 4.1 Ejecutar `pnpm vitest run src/app/api/actas src/app/api/escaneos` (pruebas enfocadas) y confirmar verde. 13/13 pruebas pasan.
- [x] 4.2 Ejecutar `pnpm test` (suite completa) y confirmar que no hay regresiones. 137/137 pruebas pasan.
- [x] 4.3 Ejecutar `pnpm test:e2e`; si algún test de `test/e2e/actas.test.ts` o `test/e2e/escaneos.test.ts` asume nivel mínimo 3, actualizarlo. 46/46 pasan sin cambios (estos tests ejercitan servicio/repositorio directamente, no el route handler donde vive `verificarRol`, así que no requieren actualización).
- [x] 4.4 Ejecutar `pnpm lint` y `pnpm typecheck`; confirmar cero errores. Ambos limpios.

## 5. Verificación manual del flujo (cuando aplica a un flujo de usuario)

- [x] 5.1 Levantar `pnpm dev:local`, iniciar sesión como `staff@local` (nivel 4, escuela 1) y confirmar que `POST /api/actas` con `escuelaId: 1` responde `201` (verificado vía fetch autenticado real en el navegador; sesión confirmada con `escuelaId: 1, regionId: 1, nivel: 4`).
- [x] 5.2 Confirmado: `POST /api/actas` y `POST /api/escaneos` con `escuelaId` de otra escuela responden `403` para la misma sesión de Staff.
- [x] 5.3 Limpiado: acta de prueba (id 7, numero_tomo 999) y escaneo huérfano (id 1, numero_tomo 999, creado en BD antes de fallar la generación de URL de subida por falta de credenciales R2 locales — no relacionado con este cambio) eliminados de `mep-actas-local.db`.

## 6. Actualizar documentación técnica (OBLIGATORIO)

- [x] 6.1 Revisado `docs/api-spec.yml`: no documenta `/api/actas` ni `/api/escaneos` (llega solo hasta `/api/usuarios/{id}`, v0.2.0). No aplica cambio — ampliar la spec para endpoints no documentados queda fuera del alcance de este change.
- [x] 6.2 Actualizado `docs/data-model.md`: agregada nota de control de acceso (nivel mínimo 4, ámbito por escuela) bajo las tablas `actas` y `escaneos`.
