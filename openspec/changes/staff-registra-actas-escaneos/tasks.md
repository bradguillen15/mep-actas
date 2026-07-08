## 0. Preparación: crear rama de feature (OBLIGATORIO — PRIMER PASO)

- [ ] 0.1 Crear la rama `feat/staff-registra-actas-escaneos` desde `main`.
- [ ] 0.2 Verificar que la rama actual es la correcta antes de tocar código.

## 1. Backend: `POST /api/actas` permite a Staff dentro de su escuela

- [ ] 1.1 Escribir prueba que falle en `src/app/api/actas/__tests__/route.test.ts` (nuevo archivo): un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/actas` con `escuelaId: 5` recibe `201` (o al menos no `403`).
- [ ] 1.2 Escribir prueba que falle: un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/actas` con `escuelaId: 10` recibe `403` y el acta no se crea.
- [ ] 1.3 Implementar en `src/app/api/actas/route.ts`: bajar `verificarRol(sesion, 3)` a `verificarRol(sesion, 4)` en `POST`, y agregar `verificarRol(sesion, 4, { escuelaId: json.escuelaId })` inmediatamente después, devolviendo `403` si no autoriza.
- [ ] 1.4 Poner en verde las pruebas de 1.1 y 1.2.

## 2. Backend: `POST /api/escaneos` permite a Staff dentro de su escuela

- [ ] 2.1 Escribir prueba que falle en `src/app/api/escaneos/__tests__/route.test.ts` (nuevo archivo): un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/escaneos` con `escuelaId: 5` recibe `201`.
- [ ] 2.2 Escribir prueba que falle: un Staff (nivel 4, `escuelaId: 5`) que envía `POST /api/escaneos` con `escuelaId: 10` recibe `403` y no se llama `prepararSubida`.
- [ ] 2.3 Implementar en `src/app/api/escaneos/route.ts`: bajar `verificarRol(sesion, 3)` a `verificarRol(sesion, 4)` en `POST`, y agregar `verificarRol(sesion, 4, { escuelaId: cuerpo.escuelaId })` inmediatamente después, devolviendo `403` si no autoriza.
- [ ] 2.4 Poner en verde las pruebas de 2.1 y 2.2.

## 3. Confirmar que niveles 1-3 no se ven afectados

- [ ] 3.1 Escribir/confirmar prueba: Admin Escuela (nivel 3) sigue pudiendo crear actas/escaneos en su propia escuela (regresión).
- [ ] 3.2 Escribir/confirmar prueba: Admin País (nivel 1) y Admin Regional (nivel 2) siguen sin restricción de ámbito en estos dos endpoints (regresión, ya que `dentroDeAmbito` solo aplica el chequeo de escuela cuando `sesion.nivel > 2`).

## 4. Ejecutar pruebas (Vitest) (OBLIGATORIO)

- [ ] 4.1 Ejecutar `pnpm vitest run src/app/api/actas src/app/api/escaneos` (pruebas enfocadas) y confirmar verde.
- [ ] 4.2 Ejecutar `pnpm test` (suite completa) y confirmar que no hay regresiones.
- [ ] 4.3 Ejecutar `pnpm test:e2e`; si algún test de `test/e2e/actas.test.ts` o `test/e2e/escaneos.test.ts` asume nivel mínimo 3, actualizarlo. Restaurar el estado de `temp-e2e.db` si alguna prueba nueva escribe datos fuera de su propio `afterAll`.
- [ ] 4.4 Ejecutar `pnpm lint` y `pnpm typecheck`; confirmar cero errores.

## 5. Verificación manual del flujo (cuando aplica a un flujo de usuario)

- [ ] 5.1 Levantar `pnpm dev:local`, iniciar sesión como `staff@local` (nivel 4, escuela 1) y confirmar en el navegador que puede completar el formulario de `/actas/nueva` para su propia escuela sin recibir 403.
- [ ] 5.2 Confirmar (vía llamada directa al API desde el navegador o unitariamente) que un intento con `escuelaId` de otra escuela responde `403`.
- [ ] 5.3 Restaurar/limpiar cualquier acta de prueba creada durante la verificación manual.

## 6. Actualizar documentación técnica (OBLIGATORIO)

- [ ] 6.1 Revisar `docs/api-spec.yml`: si documenta nivel mínimo para `POST /api/actas` o `POST /api/escaneos`, actualizarlo a nivel 4 con la nota de ámbito por escuela. Si no los documenta aún, dejar constancia de que no aplica cambio (fuera del alcance ampliar la spec de endpoints no documentados).
- [ ] 6.2 Actualizar `docs/data-model.md` si describe permisos por rol para estas operaciones.
