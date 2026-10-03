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
components/ui/             # primitivos de UI
src/hooks/                 # hooks personalizados (useXxx)
src/servicios/             # fetchers hacia app/api (cliente)
src/contextos/             # Context de sesión/usuario
app/globals.css            # tokens de diseño (variables CSS del MEP)
```

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
- Paleta base: azul `#0B3C8C` (primario), dorado `#D4A017` (acento), blanco `#FFFFFF`, grises de superficie/borde, texto `#1F2733`. Estados: éxito `#1E7E45`, error `#C0392B`. Confirmar valores exactos contra el Manual de Imagen Institucional del MEP.
- Tipografía sans-serif legible (p. ej. Inter). Tono sobrio e institucional; espaciado generoso; sin sombras fuertes ni degradados.
- **Accesibilidad WCAG AA**: contraste suficiente, foco visible, etiquetas en formularios, navegación por teclado.
- Logo oficial del MEP (SVG) en la barra superior.

## 7. Calidad

- Estados de carga y error explícitos en cada componente.
- Tipos de TypeScript correctos para props y estado; arrays de dependencias correctos en hooks.
- Extrae llamadas repetidas a fetchers/servicios y patrones de UI a componentes/hooks reutilizables.
- Mensajes al usuario claros y en español.
- Solo exponer variables de entorno al cliente con prefijo `NEXT_PUBLIC_` cuando sea seguro (nunca secretos).

## 8. Pruebas

- Vitest (con jsdom y Testing Library) para lógica de UI, hooks y páginas; la lógica extraíble de las páginas (p. ej. `src/lib/personas.ts`) se prueba como función pura. Los E2E corren con Vitest contra SQLite (`pnpm test:e2e`); los flujos clave (consulta, registro de actas, gestión de escaneos) se verifican además en el navegador con `pnpm dev`.
- Actualiza las pruebas E2E cuando cambie un flujo de usuario, los `data-testid` o los diálogos.
- Cobertura pragmática, sin umbral fijo.
