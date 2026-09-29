# Sistema de Consulta de Títulos — MEP Costa Rica

Aplicación web cerrada y autenticada para que el personal del Ministerio de Educación Pública (MEP) de Costa Rica registre actas de graduación, digitalice los folios físicos y consulte instantáneamente si una persona se graduó (por nombre o por número de identificación).

> Arranca como piloto en una escuela y está diseñado para escalar a nivel nacional. Ver el documento de requerimientos completo en **[docs/brd.md](docs/brd.md)** (fuente de verdad del producto).

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router) — frontend y backend en un solo proyecto, renderizado en cliente |
| Base de datos | Turso (libSQL/SQLite) con Drizzle ORM |
| Autenticación | NextAuth (JWT), contraseñas con bcrypt |
| Archivos | Cloudflare R2 (escaneos de folios, URLs firmadas del lado del servidor) |
| Estado (cliente) | SWR (datos) · React Context (sesión) · useReducer (formularios) |
| Pruebas | Vitest (unitarias/servicios) · Playwright (E2E) |
| Despliegue | Vercel |

Detalles y convenciones: **[docs/backend-standards.md](docs/backend-standards.md)** y **[docs/frontend-standards.md](docs/frontend-standards.md)**.

---

## Idioma

Es un producto del Gobierno de Costa Rica: **todo va en español (Costa Rica)** — código, comentarios, commits, documentación, esquema de base de datos (tablas/columnas) e interfaz.

---

## Arquitectura (resumen)

```
Navegador → API de Next.js (route handlers, verifican sesión + rol) → Turso / Cloudflare R2
```

Por capas pragmática: `app/api` (route handlers) → servicios → repositorios (Drizzle). El navegador nunca toca la base ni R2; los secretos viven solo en el servidor (variables de entorno de Vercel).

---

## Documentación

- **[docs/brd.md](docs/brd.md)** — requerimientos de negocio (fuente de verdad).
- **[docs/base-standards.md](docs/base-standards.md)** — principios, TDD, idioma.
- **[docs/backend-standards.md](docs/backend-standards.md)** — API, Drizzle/Turso, seguridad, pruebas.
- **[docs/frontend-standards.md](docs/frontend-standards.md)** — Next.js/React, estado, identidad MEP.
- **[docs/documentation-standards.md](docs/documentation-standards.md)** — estándares de documentación.

### Desarrollo guiado por specs con IA

Este proyecto usa [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) (SDD) con persistencia `openspec`; los artefactos viven en `openspec/`:

```
/gentle-sdd-new → /gentle-sdd-ff → /gentle-sdd-apply → /gentle-sdd-verify → /gentle-sdd-archive
```

Requiere Gentle AI instalado globalmente (`gentle-ai install`). Ver la sección 4 de [CLAUDE.md](CLAUDE.md).

---

## Estado

En arranque. La estructura de la aplicación (`app/`, `src/`, esquema Drizzle, etc.) aún no está creada — ver **[docs/initialize-project.md](docs/initialize-project.md)**.
