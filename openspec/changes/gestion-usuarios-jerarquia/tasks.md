## 1. Preparación

- [x] 1.1 Crear la rama de feature `feat/gestion-usuarios-jerarquia` desde `main`.
- [x] 1.2 Leer `docs/brd.md` (§6), `docs/backend-standards.md` y `docs/frontend-standards.md`; adoptar `ai-specs/agents/backend-developer.md`.

## 2. Acceso a datos (repositorio)

- [x] 2.1 Escribir prueba que falle para `obtenerNivelDeRol(rolId)` en `usuarios.repositorio` (devuelve el `nivel` del rol o `undefined`).
- [x] 2.2 Implementar `obtenerNivelDeRol` hasta poner la prueba en verde.
- [x] 2.3 Escribir prueba que falle para `obtenerAmbitoDeFuncionario(funcionarioId)` → `{ escuelaIds, regionIds }` leyendo `funcionario_escuela` + `escuelas.region_id`.
- [x] 2.4 Implementar `obtenerAmbitoDeFuncionario` hasta poner la prueba en verde.

## 3. Autorización de jerarquía y ámbito (servicio)

- [x] 3.1 Escribir pruebas unitarias que fallen en `usuarios.servicio` para `crear`: deniega si `nivelRolDestino < sesion.nivel` (lanza `ForbiddenError`) y permite si `>=` (caso Admin Regional→Admin Escuela y Admin País→cualquier nivel).
- [x] 3.2 Escribir pruebas unitarias que fallen para `crear` con ámbito: Admin Escuela no crea usuarios de otra escuela; Admin Regional sí dentro de su región; Admin País sin restricción.
- [x] 3.3 Implementar en `crear` la verificación de jerarquía (nivel del rol destino) y de ámbito (reusando `verificarRol` con el ámbito del funcionario destino) antes de insertar; lanzar `ForbiddenError` al violar la regla. Mantener la auditoría existente.
- [x] 3.4 Escribir pruebas que fallen y luego aplicar la misma verificación en `actualizarPassword` y `cambiarEstado` (usando el rol/ámbito del usuario destino).
- [x] 3.5 Ajustar la firma del servicio para recibir las nuevas lecturas del repositorio (inyección), manteniendo la separación servicio→repositorio.

## 4. Rutas (route handlers)

- [x] 4.1 Escribir prueba E2E que falle: un Admin Regional autenticado que crea un Admin País recibe `403` y no se crea el usuario.
- [x] 4.2 Propagar la sesión a las nuevas validaciones en `app/api/usuarios/route.ts` y `app/api/usuarios/[id]/route.ts`, y mapear `ForbiddenError` → `403` (junto a `ConflictError`→409 y `NotFoundError`→404).
- [x] 4.3 Poner en verde la prueba E2E del 4.1.

## 5. Pruebas entre roles (cierre de brecha)

- [x] 5.1 En `test/e2e/usuarios.test.ts`, usar realmente `sesionAdminRegional` y agregar casos permitidos/denegados de jerarquía y ámbito para `crear`, `actualizarPassword` y `cambiarEstado`.
- [x] 5.2 Ejecutar `pnpm test` y `pnpm test:e2e`; verificar que el estado de la base se restaura tras las pruebas que escriben.

## 6. UI de gestión de usuarios

- [x] 6.1 Agregar la entrada "Usuarios" al `Sidebar` visible para `nivel <= 3` (patrón `adminOnly` existente).
- [x] 6.2 Crear la pantalla de gestión: listar usuarios (SWR), formulario de invitar/crear (`useReducer`), acciones de restablecer contraseña y activar/desactivar; usar tokens de diseño MEP (sin colores embebidos), textos en español, accesibilidad WCAG AA.
- [x] 6.3 Limitar el selector de rol a `nivel >= sesion.nivel` y el ámbito según el rol en sesión; no ofrecer auto-registro.
- [x] 6.4 Manejar respuestas `403` del backend mostrando un mensaje claro de permiso insuficiente.

## 7. Verificación y documentación

- [x] 7.1 Ejecutar `pnpm verify` (lint + typecheck + test + e2e) en verde.
- [x] 7.2 Verificación manual de flujo en la app: Admin País crea usuarios de todos los niveles; Admin Regional limitado a su región; Staff sin acceso a la sección.
- [x] 7.3 Actualizar documentación: `docs/api-spec.yml` (respuestas 403 de usuarios) y `docs/data-model.md`/notas de roles si aplica; todo en español.
