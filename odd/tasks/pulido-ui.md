# Pulido de la UI

## Objetivo

Pulir la interfaz completa de la aplicación (fundaciones visuales, componentes base, shell y páginas) siguiendo la filosofía de design engineering de Emil Kowalski, y corregir los defectos funcionales que encontró el review.

## Problema y por qué

El review del 2026-10-03 encontró que la app funciona, pero no se siente terminada:

- La fuente Inter está declarada y nunca se carga.
- No existe ningún sistema de movimiento: no hay curvas propias, ni feedback al presionar, ni manejo de reduced-motion.
- Faltan los estados de error, de esqueleto y de éxito.
- Cada página resuelve los mismos patrones a su manera.

## Alcance

- Fundaciones: fuente, tokens, curvas, reduced-motion, grises hardcodeados y documentación de estándares.
- Componentes base: button, Campo, Modal, Tabla, esqueletos, Alerta, toasts y ConfirmDialog.
- Shell: header, sidebar, menú móvil y ancho máximo.
- Páginas: login, consultar, actas (listado, nueva y detalle), usuarios, tomos, auditoría y configuración.
- Fixes funcionales:
  - `sort` que muta el caché de SWR en tomos.
  - `JSON.parse` sin try/catch en auditoría.
  - Comando de desarrollo visible en el login.
  - "Desactivar" sin confirmación en usuarios.

Fuera de alcance: cambiar la paleta, cambios de API o del modelo de datos, y la feature `/ayuda` (`odd/tasks/manual-usuario-ayuda.md`).

## Restricciones

- Se mantiene la paleta: navy `#172B54` y dorado `#CFAC65`.
- Todo se escribe en español de Costa Rica (código, textos y pruebas). Los comentarios son mínimos.
- No se hacen commits ni push salvo que el usuario los pida (CLAUDE.md §1). Por eso no hay commits de unidad de trabajo ni review RDD por commit.
- No se tocan los cambios ajenos que ya están en el árbol de trabajo: `api/escuelas`, `escuelas.servicio` y `tomos/__tests__`, salvo para mantener sus pruebas en verde.
- Valores de movimiento:
  - `--ease-out: cubic-bezier(0.23,1,0.32,1)`.
  - 150 ms para feedback y hover.
  - 200 ms para entradas.
  - La salida es más rápida que la entrada.
  - Solo se animan `transform` y `opacity`.
  - El hover va bajo `(hover:hover) and (pointer:fine)`.

## Modo TDD

- Estado: activado para lógica y comportamiento (fixes, componentes con comportamiento nuevo).
- Fuente: CLAUDE.md del proyecto, §1.
- Runner: `pnpm test` (Vitest con jsdom). Los ajustes puramente estilísticos se verifican visualmente y con las pruebas existentes.

## Checks por tarea

`pnpm lint`, `pnpm typecheck` y `pnpm test`, más la verificación visual en `pnpm dev:local`. La línea base del 2026-10-03 es: 62 archivos y 427 pruebas en verde.

## Tareas

- [x] **F1 — Fundaciones.** Ruta: delegada (toca más de 2 archivos no triviales).
  - `layout.tsx` pasa a ser un componente de servidor, con `next/font` Inter y `metadata`.
  - Se unifican los tokens: las variables de shadcn se derivan de los tokens en español.
  - Se agregan los tokens `acento-texto` y `texto-suave`, y las curvas y duraciones en `@theme`.
  - Se agregan reduced-motion, `h-dvh`, `tabular-nums` y `text-wrap: balance`.
  - Se reemplazan los grises y rojos hardcodeados por tokens.
  - Se actualiza la paleta en `docs/frontend-standards.md`.
- [x] **F2 — Componentes base.** Ruta: delegada.
  - `button`: transiciones explícitas, `active:scale-[0.97]`, anillo de foco visible, `asChild`/`BotonEnlace` y variantes reales.
  - `Campo`: `useId`, `requerido`, `ayuda` y `aria-describedby`.
  - Un estilo de campo único.
  - Modal y dialog: tiempos asimétricos, overlay con el tono de la marca, cierre de 36px y footer fijo.
  - `Tabla`: hover condicionado, filas accesibles por teclado, `aria-sort`, escalonado y esqueleto.
  - Spinner único con `role="status"`.
  - Componentes nuevos: `Alerta`, `ConfirmDialog`, toasts con sonner, `BotonIcono`, `EncabezadoPagina` y `ListaDefiniciones`.
- [x] **F3 — Shell.**
  - Header con título de sección y usuario.
  - Sidebar con barra dorada y `aria-current`.
  - Menú móvil animado y accesible.
  - `main` con ancho máximo.
- [x] **F4 — Páginas A.**
  - Login: marca, `autoFocus`, mostrar contraseña, alerta y fix del comando de desarrollo.
  - Consultar: altura, búsqueda con ícono y botón de limpiar, panel animado, estados de error y `dl` en el modal.
  - Actas: listado, `FormularioActa` compartido entre nueva y detalle, botón para volver, barra de acciones fija y toasts.
- [x] **F5 — Páginas B.**
  - Usuarios: menú de acciones, `ConfirmDialog` para desactivar, `ModalFormulario` en el reset y textos.
  - Tomos: `ZonaCarga` con drag and drop y fix del `sort`.
  - Auditoría: etiquetas legibles, fechas, fix de `JSON.parse` y estado de carga.
  - Configuración: pestañas accesibles con indicador y `ConfirmDialog`.
- [x] **F6 — Verificación final.**
  - Checks completos.
  - Recorrido visual en desktop y móvil.
  - Cierre del documento.

- [x] **F7 — Correcciones del feedback externo.** Ruta: delegada, porque toca más de 2 archivos no triviales.
  - Auditoría alineada al BRD §7.5: niveles 1 a 4, en la UI, el menú y el manual.
  - `aria-describedby` en Modal.
  - `obtenerJson` estricto en configuración, con estado de error.
  - DialogoConfirmacion no se cierra mientras confirma.
  - Focus trap en el cajón móvil.
  - Validación de tomos por extensión.
  - Links MDX seguros.
  - Manual de usuarios actualizado.
  - Renombre de `ConfirmDialog.tsx` a `DialogoConfirmacion.tsx`.
  - Prueba de ruta para la autodesactivación.
- [x] **F8 — Atomicidad al crear actas.** Ruta: delegada.
  - Endpoint que crea el acta con sus estudiantes en una sola transacción.
  - El cliente usa una sola llamada.
  - El error se muestra con el detalle de la API.
  - Se actualiza `api-spec`.
- [x] **F9 — Commits.** Autorizados por el usuario el 2026-10-03. Se commitean solo los archivos de esta feature, separados en unidades de trabajo. Quedan fuera la feature `/ayuda` de la otra sesión y los cambios previos de `api/escuelas`.

## Progreso

- F1 (delegada): fuente Inter, tokens unificados (`acento-texto` #7A5F22 en lugar de #8A6D2B, para tener margen AA sobre el tinte), curvas, `hover-fino` y `presionable`, reduced-motion, grises a tokens y docs §6. Checks: lint OK, test OK. El typecheck solo falla en archivos de la sesión `/ayuda` en curso.
- F2 (delegada, TDD con RED→GREEN observado): button y Boton (cva, asChild, sin salto al cargar), BotonIcono, Campo (useId, requerido, ayuda, aria), estilo de campo único, dialog y Modal (pie fijo, tiempos asimétricos), ModalFormulario, Tabla (teclado, aria-sort, meta.className, escalonado, cargando y vacío), Esqueleto, spinner, Alerta, DialogoConfirmacion, EncabezadoPagina, ListaDefiniciones y Notificador (sonner). Se corrigió la sintaxis de `@custom-variant hover-fino`. Checks: lint, typecheck y test (76 archivos, 491 pruebas) OK.
- F3 (delegada, TDD): `navegacion.ts` compartido (conserva el ítem Ayuda de la otra sesión), Sidebar con barra dorada y `aria-current`, Header sticky con título de sección, CajonNavegacion animado y accesible, y main con `max-w-7xl`. Las etiquetas de rol quedaron alineadas al producto (Admin País/Regional/Escuela, Staff). Checks: lint, typecheck y test (78 archivos, 505 pruebas) OK.
- F4A (delegada, TDD): login (marca, CampoContrasena, Alerta, fix del comando dev visible solo en development) y consultar (flujo natural, grupo de búsqueda, panel avanzado animado, keepPreviousData, estados de error y vacío, ListaDefiniciones, "Ver acta"). Se agregó `obtenerJsonEstricto`.
- F4B (delegada, TDD): listado de actas, FormularioActa, FilaEstudiante y Seccion compartidos, volverA, barra de acciones fija, toasts, esqueleto y error en el detalle, regla folioFin >= folioInicio (solo cliente) y fix de `Number("")` en nueva. Los payloads no cambian.
- F5A (delegada, TDD): usuarios (DialogoConfirmacion para desactivar, sin desactivar la propia cuenta en la UI, reset con ModalFormulario y política de 12 caracteres, "Nuevo usuario"/"Crear usuario") y configuración (Pestanas accesibles con indicador deslizante y `?tab=`, BarraSeccion, confirmación al eliminar tipo de acta).
- F5B (delegada, TDD): tomos (fix de `sort` sobre el caché de SWR, ZonaCarga con drag and drop y validación jpg/png/pdf hasta 20 MB, visor con teclado y fade) y auditoría (fix de `JSON.parse` seguro, sin destello de "Acceso restringido", etiquetas legibles, fechas es-CR y diff campo por campo). Se agregó `useValorRetenido` para salidas de modal sin contenido en blanco.
- F6 (inline): se eliminaron 7 warnings de lint (índices dinámicos pasan a Map y `.at()` con guarda de índice negativo), y el título del header se oculta en móvil porque el logo lo truncaba. Checks: lint 0/0, typecheck limpio y test con 90 archivos y 580 pruebas en verde. Recorrido visual en 1440 y 375: consultar, actas, detalle, usuarios, modal, tomos, configuración y menú móvil.

## Pendientes y observaciones (resueltos)

- **Autodesactivación**: `usuarios.servicio.cambiarEstado` ahora lanza `ErrorProhibido("No puede desactivar su propia cuenta")` antes de tocar el repositorio, aunque el usuario sea Admin País. TDD con RED observado (antes devolvía NotFoundError) y luego GREEN.
- **Columna "Región" vacía**: TanStack Table cachea por fila los valores de `accessorFn`. Si las regiones llegaban después que las escuelas, con el mismo array de datos, la celda se quedaba con `""`. Ahora las filas se derivan con `nombreRegion` mediante `useMemo([escuelas, regiones])`. TDD con RED observado y luego GREEN. Mismo fix preventivo en el listado de actas (`nombreTipo`), con prueba de regresión escrita después del fix.
- **"Scroll interno en consultar"**: era un falso positivo. Consultar no usa `virtualizada`, y medido en 375 px el único contenedor con scroll es `main`.
- No hay commits (regla del proyecto).

## Feedback externo y atomicidad (F7–F9)

- F7 (delegada, TDD):
  - Auditoría visible para los niveles 1 a 4 según BRD §7.5: página, menú (ahora en Principal) y manual.
  - Modal ya no pisa `aria-describedby`, así que las descripciones se anuncian.
  - `bloquearCierre` mientras se confirma.
  - Focus trap en el cajón móvil, con `inert` en el fondo.
  - Configuración usa `obtenerJsonEstricto` con `ErrorCarga`; `obtenerJson` se eliminó.
  - Validación de escaneos por extensión, con una sola fuente en `lib/escaneos.ts`.
  - `clasificarEnlace` para los links MDX.
  - Manual de usuarios actualizado.
  - `ConfirmDialog.tsx` pasó a llamarse `DialogoConfirmacion.tsx`.
  - Prueba de ruta para la autodesactivación (es de caracterización, no partió de un RED).
- F8 (delegada, TDD):
  - `POST /api/actas` con `estudiantes` y `POST /api/actas/{id}/estudiantes` con `{ estudiantes }` corren en una sola transacción de Drizzle. Eso incluye resolver o crear personas y los registros de auditoría.
  - La validación de duplicados ocurre antes de escribir y devuelve 400. Un error de persistencia devuelve 500 con el estudiante que falló.
  - El cliente hace una sola llamada y muestra el mensaje de la API.
  - El rollback se probó en e2e con un trigger SQLite: sin la transacción fallan 3 de 6 pruebas.
  - Pendiente aceptado: en modo edición, el PATCH del acta y el lote de estudiantes siguen siendo 2 requests. El PATCH es idempotente.
- Checks finales: lint 0/0, typecheck limpio, test (96 archivos y 653 pruebas) y test:e2e (17 archivos y 116 pruebas) en verde.
- F9: 9 commits por unidad de trabajo, aprobados por el usuario. Incluyen el trabajo terminado de otras sesiones que estaba en el árbol: `/ayuda`, los 403 de escuelas y el e2e de almacenamiento local. Sin push.

