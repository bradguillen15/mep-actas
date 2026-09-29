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

## 8. Cierre de brechas descubiertas en auditoría de seguridad (BRD §7.4)

Una auditoría contra `docs/brd.md` encontró que la validación de ámbito de esta change (sección 3) descansa sobre `sesion.escuelaId`/`sesion.regionId`, pero ningún flujo real los llena — el JWT y `obtenerSesion()` solo cargan `usuarioId`, `email`, `rolId`, `nivel`, `funcionarioId`. En producción, `dentroDeAmbito` siempre evalúa `undefined` y el escenario "Verificación de ámbito por escuela" de `autenticacion-roles/spec.md` no se cumple fuera de las pruebas unitarias (que construyen `SesionUsuario` a mano). Además, `cambiarEstado` (desactivar) no tiene efecto real: el login no verifica `usuarios.activo`.

- [x] 8.1 Escribir prueba que falle: `authorize()` de NextAuth rechaza credenciales válidas de un usuario con `activo = false`.
- [x] 8.2 Implementar el chequeo de `activo` en `obtenerUsuarioPorEmail` (agregar `activo` al select) y en `authorize()`.
- [x] 8.3 Escribir prueba que falle: el callback `jwt` de NextAuth resuelve y adjunta `escuelaId`/`regionId` reales a partir de `obtenerAmbitoDeFuncionario` (o equivalente) en el primer login.
- [x] 8.4 Implementar la resolución de ámbito real en el callback `jwt`/`session`, cubriendo el caso de un funcionario con varias escuelas (usar la primera escuela/región como ámbito "propio" para las comparaciones de `verificarRol`, documentando la limitación si el funcionario pertenece a varias).
- [x] 8.5 Re-ejecutar `pnpm test` y `pnpm test:e2e`; confirmar que el escenario de `autenticacion-roles/spec.md` ("Admin Escuela de escuela_id=5 no accede a escuela_id=10") pasa con una sesión real, no solo mockeada. Verificado además en el navegador (`pnpm dev:local`): login de `admin@pais.local` devuelve `escuelaId`/`regionId` reales en `/api/auth/session` (antes siempre `undefined`).

## 9. Responsividad y conformidad con el BRD (§6)

La revisión pidió dos mejoras: (a) la pantalla de usuarios no es usable en viewports pequeños (encabezado y tabla de ancho fijo, barra lateral siempre visible), y (b) falta una prueba que valide la matriz de permisos del BRD §6 de punta a punta. Al diseñar esa prueba se detectó que las rutas de usuarios exigen `nivel <= 2` (`verificarRol(sesion, 2)`), contradiciendo el BRD ("Admin Escuela … crea usuarios staff de su escuela") y el propio spec de esta change (UI y gestión para `nivel <= 3`).

- [x] 9.1 Escribir prueba de conformidad BRD §6 (servicio, `test/e2e/conformidad-brd-usuarios.test.ts`): matriz completa de jerarquía — cada nivel crea su mismo nivel o inferior y se deniega cualquier nivel superior; Staff (`nivel: 4`) no puede gestionar usuarios; Admin Escuela crea Staff de su escuela y se le deniega fuera de ella. Sirve como red de regresión permanente contra el BRD (19 pruebas).
- [x] 9.2 Escribir pruebas de ruta que fallen: Admin Escuela (`nivel: 3`) autenticado recibe `201` al crear un Staff vía `POST /api/usuarios` (hoy `403`); Staff (`nivel: 4`) recibe `403`; sin sesión se responde `401`. Confirmado el fallo inicial (403 en vez de 200/201).
- [x] 9.3 Corregir `verificarRol(sesion, 2)` → `verificarRol(sesion, 3)` en `app/api/usuarios/route.ts` y `app/api/usuarios/[id]/route.ts`; poner en verde 9.1 y 9.2.
- [x] 9.4 Escribir prueba de componente que falle (jsdom + Testing Library): la pantalla de usuarios ofrece una vista de tarjetas para móvil (`md:hidden`) con las acciones de contraseña y estado, la tabla solo en `md+` y el encabezado apilable en columna. Nota: se bajó `jsdom` a v26 porque la v29 requiere `require(esm)` (Node >= 20.19) y el entorno usa Node 20.18.
- [x] 9.5 Implementar la responsividad: encabezado apilable y tarjetas móviles en `app/usuarios/page.tsx`, navegación plegable (barra lateral oculta bajo `md` con menú desplegable accesible en `Header`/`Providers`, cierre con Escape y al navegar) y padding adaptable del contenido. Además se cerró una brecha de la tarea 6.4: `manejarCambioEstado` ignoraba el `403` en silencio; ahora muestra mensaje claro (con prueba de componente).
- [x] 9.6 Actualizar `docs/api-spec.yml` (acceso de usuarios pasa de `nivel <= 2` a `nivel <= 3`).
- [x] 9.7 Ejecutar `pnpm verify` en verde (146 unitarias + 65 e2e) y verificación visual en el navegador con sesión de Admin Escuela: móvil (tarjetas, menú desplegable, sin scroll horizontal) y escritorio (tabla completa); `GET /api/usuarios` responde 200 para nivel 3 (antes 403).
