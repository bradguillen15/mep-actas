# Reforzar el uso de shadcn/ui

## Objetivo

Dejar explícita y enforceable la capa dual shadcn + wrappers en español: los primitivos de Radix/shadcn son la base visual y de accesibilidad; las páginas y features solo consumen wrappers de dominio. Cerrar los gaps donde hoy se usa HTML nativo (sobre todo dropdowns).

## Tareas

- [x] **S0 — Rama.** `feat/reforzar-shadcn`.
- [x] **S1 — Estándar escrito.** Sección en `docs/frontend-standards.md`.
- [x] **S2 — `Selector` sobre Radix (TDD).** Pruebas + wrapper sobre `select.tsx`; tokens MEP en el menú.
- [x] **S3 — Consumidores nativos.** `Paginacion` con `Selector`; callers RHF con `Controller`; pruebas adaptadas.
- [x] **S4 — ESLint.** `no-restricted-syntax` prohíbe `<select>` fuera de `src/components/ui/**`.
- [ ] **S6 — Verificación.** lint, typecheck, test.

## Fase 2 (backlog)

- Migrar `Pestanas` → Tabs shadcn.
- Evaluar `DropdownMenu` para menús de acciones de fila.
- Pasada de botones ad hoc en Sidebar/Tabla.

## Progreso

- Rama: `feat/reforzar-shadcn`.
- Decisión: enforzar shadcn vía wrappers ES (2026-10-03).
