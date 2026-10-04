---
description: Estándares de frontend del Sistema de Consulta de Títulos del MEP — Next.js (App Router) con React renderizado en cliente, SWR (datos), React Context (sesión), useReducer (formularios), identidad visual MEP. Todo en español.
globs: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}", "app/globals.css", "tailwind.config.ts"]
alwaysApply: true
---

# Estándares de Frontend

> Producto del Gobierno de Costa Rica. **Toda la interfaz, los textos, los mensajes, el código y la documentación van en español (Costa Rica).**

## 1. Stack

- **Framework:** Next.js (App Router), React renderizado del lado del cliente (sin SSR). El contenido vive detrás de autenticación.
- **Lenguaje:** TypeScript estricto. Componentes nuevos en `.tsx`.
- **Datos:** SWR (`useSWR`, `useSWRMutation`).
- **Sesión:** React Context (apoyado en NextAuth).
- **Formularios:** React Hook Form (`useFieldArray` para tablas editables tipo estudiantes).
- **Estilos:** variables CSS / tokens de diseño con la identidad MEP (ver `docs/brd.md` §9.3).

## 2. Arquitectura por componentes

- Componentes funcionales con hooks; separa presentación de lógica de negocio.
- Páginas en `app/**/page.tsx`; marca `"use client"` cuando manejen estado/interacción.
- Navegación con `next/navigation` (`useRouter`, `useParams`, `usePathname`).
- Props tipadas con interfaces de TypeScript. Nombres de componentes en PascalCase y en español (p. ej. `DetalleActa.tsx`, `BusquedaGraduacion.tsx`).

### Estructura sugerida
```
app/                       # rutas (page.tsx, layout.tsx)
components/                # componentes reutilizables
components/ui/             # primitivos shadcn + wrappers en español
src/hooks/                 # hooks personalizados (useXxx)
src/servicios/             # fetchers hacia app/api (cliente)
src/contextos/             # Context de sesión/usuario
app/globals.css            # tokens de diseño (variables CSS del MEP)
```

### Capa UI (shadcn + wrappers)

La UI base usa **shadcn/ui** (estilo new-york, Radix, CVA, Lucide) con una capa dual:

| Capa | Dónde | Quién importa |
| --- | --- | --- |
| Primitivos shadcn (`button.tsx`, `select.tsx`, `dialog.tsx`, …) | Solo `src/components/ui/` | Solo wrappers u otros archivos dentro de `ui/` |
| Wrappers en español (`Boton`, `Selector`, `Modal`, …) | `src/components/ui/` + barrel `index.ts` | Páginas (`src/app/**`) y features (`actas`, `usuarios`, `configuracion`, `ayuda`, `layout`, …) |

Mapeo actual:

| Primitivo | Wrapper / API pública |
| --- | --- |
| `button` | `Boton`, `BotonIcono` |
| `select` | `Selector` |
| `dialog` | `Modal`, `ModalFormulario`, `DialogoConfirmacion` |
| `input` / `label` | `Campo`, `CampoContrasena` |
| `table` | `Tabla` |
| `card` | `Tarjeta` |
| `tooltip` | `BotonIcono` (y exports de tooltip) |

Reglas:

- No uses `<select>` nativo fuera de `src/components/ui/` (ESLint lo prohíbe). Usa `Selector`.
- No importes primitivos shadcn desde páginas o features; importa el wrapper o `@/components/ui`.
- Para agregar un control nuevo: añadir el primitivo shadcn (si falta) → wrapper en español → export en `index.ts` → pruebas con Vitest/Testing Library.
- En formularios con React Hook Form, integra `Selector` con `Controller` (Radix no es un `<select>` nativo).

## 3. Datos con SWR

- Centraliza el fetching con `useSWR`; las mutaciones con `useSWRMutation` o `mutate`.
- Los fetchers llaman a los **route handlers de `app/api`**. El cliente **nunca** accede directo a la base de datos ni a Cloudflare R2.
- Maneja siempre, y de forma explícita, los estados de **carga**, **error** y **vacío** ("Sin registros").
- Revalida tras mutaciones para mantener la caché consistente.

## 4. Sesión con React Context

- El usuario actual, su rol y el estado de autenticación viven en un Context.
- La UI muestra/oculta acciones según el rol jerárquico (Admin País/Regional/Escuela/Staff), pero **la autorización real siempre se valida en el servidor**.
- Redirige a inicio de sesión cuando no hay sesión válida.

## 5. Formularios con React Hook Form

- Los formularios de alta (actas, escaneos, usuarios) se implementan con React Hook Form.
- Usa `useFieldArray` para listas dinámicas (ej. tabla de estudiantes en un acta).
- Validación en cliente con `zod` (via `@hookform/resolvers`) solo para UX; la validación autoritativa ocurre en el backend.
- Deshabilita el envío mientras hay una operación en curso; muestra errores de campo en español.

## 6. Identidad visual y accesibilidad (MEP)

- Define la paleta como **variables CSS / tokens** (`--color-primario`, `--color-acento`, …). **Nunca** colores embebidos (`#0B3C8C`, `bg-blue-700`) en componentes.
- Paleta base: azul marino `#172B54` (primario), dorado `#CFAC65` (acento), dorado oscuro `#7A5F22` (`acento-texto`, solo para texto sobre fondo claro; contraste AA), blanco `#FFFFFF`, grises de superficie/borde, texto `#1F2937` y texto suave `#6B7280`. Estados: éxito `#1E7E45`, error `#C0392B` (hover `#A93226`). Cada valor se define una sola vez en `src/app/globals.css`.
- Tipografía sans-serif legible (p. ej. Inter). Tono sobrio e institucional; espaciado generoso; sin sombras fuertes ni degradados.
- **Accesibilidad WCAG AA**: contraste suficiente, foco visible, etiquetas en formularios, navegación por teclado.
- Los botones solo-ícono usan `BotonIcono`: la prop `etiqueta` alimenta el `aria-label` y el tooltip (Radix). No uses `title` nativo ni botones ícono ad hoc.
- La `etiqueta` describe solo la acción (`Eliminar`, `Desactivar`, `Restablecer contraseña`). No incluya el nombre, correo u otro identificador del registro afectado: ese contexto ya está en la fila o diálogo de confirmación.
- Logo oficial del MEP (SVG) en la barra superior.

### Movimiento

- Curvas (tokens en `globals.css`): `ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` para entradas y feedback, `ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` para movimientos en pantalla y `ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)` para paneles laterales e inferiores.
- Duraciones: 150 ms para feedback y hover, 200 ms para entradas; la salida es más rápida que la entrada y nada en la UI dura más de 300 ms.
- Se anima solo `transform` y `opacity`.
- El hover va bajo la variante `hover-fino` (`(hover: hover) and (pointer: fine)`) para evitar hovers pegados en pantallas táctiles.
- Los elementos presionables usan `active:scale-[0.97]` (utilidad `presionable`).
- Se respeta `prefers-reduced-motion`: `globals.css` reduce animaciones y transiciones a casi cero.

## 7. Calidad

- Estados de carga y error explícitos en cada componente.
- Tipos de TypeScript correctos para props y estado; arrays de dependencias correctos en hooks.
- Extrae llamadas repetidas a fetchers/servicios y patrones de UI a componentes/hooks reutilizables.
- Mensajes al usuario claros y en español.
- Solo exponer variables de entorno al cliente con prefijo `NEXT_PUBLIC_` cuando sea seguro (nunca secretos).

## 8. Pruebas

- Vitest (con jsdom y Testing Library) para lógica de UI, hooks y páginas; la lógica extraíble de las páginas (p. ej. `src/lib/personas.ts`) se prueba como función pura. Los E2E corren con Vitest contra SQLite (`pnpm test:e2e`); los flujos clave (consulta, registro de actas, gestión de escaneos) se verifican además en el navegador con `pnpm dev:local`.
- Actualiza las pruebas E2E cuando cambie un flujo de usuario, los `data-testid` o los diálogos.
- Cobertura pragmática, sin umbral fijo.

## 9. Manual de usuario (`/ayuda`)

El manual vive en `src/contenido/ayuda/`, fuera del árbol de rutas. Cada tema es un archivo `.mdx` y se registra en tres lugares.

Para agregar un tema:

1. Agregue la entrada en el catálogo `src/contenido/ayuda/temas.ts`: `slug`, `titulo`, `descripcion`, `niveles`, `orden` y `palabrasClave` (incluya sinónimos que las personas usuarias escribirían).
2. Agregue el `slug` a `slugsConContenido` en `src/contenido/ayuda/slugs.ts`.
3. Agregue su cargador en `src/contenido/ayuda/contenido.ts` (`import("./<slug>.mdx")`).
4. Cree `src/contenido/ayuda/<slug>.mdx`. Empiece con encabezados `##` (el título de la página ya es el `titulo` del catálogo) y use solo los elementos que estilizan `src/mdx-components.tsx`.

Reglas:

- `niveles` controla la visibilidad (1 Admin País, 2 Admin Regional, 3 Admin Escuela, 4 Staff) y se aplica **en el servidor**: el índice y la página de cada tema consultan la sesión. No filtre en el cliente.
- La prueba `src/contenido/ayuda/__tests__/temas.test.ts` falla si el catálogo y la lista de slugs no coinciden. Escríbala en rojo primero: agregue la entrada al catálogo y luego el contenido.
- Escriba solo lo que la aplicación hace hoy y use las etiquetas reales de la interfaz. Cuando cambie una funcionalidad, actualice su tema en el mismo cambio.
- Redacte en español de Costa Rica, con trato de «usted» y lenguaje sencillo para personal no técnico.
