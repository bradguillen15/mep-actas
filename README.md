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
| Pruebas | Vitest (unitarias/servicios) · Vitest contra SQLite (E2E) |
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

### Diagramas interactivos

- **[Arquitectura general](https://htmlpreview.github.io/?https://github.com/bradguillen15/mep-actas/blob/main/docs/arquitectura/arquitectura-general/arquitectura-general.html)**: capas, autenticación, auditoría y almacenamiento de escaneos.
- **[Alcance por escuela y región](https://htmlpreview.github.io/?https://github.com/bradguillen15/mep-actas/blob/main/docs/arquitectura/alcance-escuela-region/alcance-escuela-region.html)**: cómo se autoriza cada solicitud según el rol y su ámbito.
- **[Ciclo de vida de un acta](https://htmlpreview.github.io/?https://github.com/bradguillen15/mep-actas/blob/main/docs/arquitectura/ciclo-vida-acta/ciclo-vida-acta.html)**: estados implementados frente a los definidos en el BRD.

GitHub muestra los archivos `.html` como código fuente, por eso los enlaces pasan por htmlpreview para verlos renderizados. La fuente de cada diagrama (archify) está junto al HTML en [`docs/arquitectura/`](docs/arquitectura/).

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

## Desarrollo local

`pnpm dev` inicia Next.js contra la base configurada en `TURSO_DATABASE_URL` (Turso remoto cuando esté configurado); no siembra nada.

`pnpm dev:local` es el modo demo: aplica las migraciones y siembra la base local (`file:./mep-actas-local.db`) antes de iniciar Next.js, forzando esa URL aunque `.env.local` apunte a Turso. La semilla es idempotente (se puede ejecutar en cada arranque) y se niega a correr contra una URL que no sea `file:`. Las pruebas E2E reutilizan el mismo conjunto de datos.

- `pnpm db:sembrar`: migra y siembra sin iniciar la aplicación.
- `pnpm db:reiniciar`: borra el archivo local y el almacenamiento local de escaneos, y lo regenera todo desde cero.

### Escaneos en desarrollo (sin R2)

Con `NODE_ENV=development` (`pnpm dev`, `pnpm dev:local`) y sin las variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY`, adjuntar y ver escaneos en Tomos funciona sin cuenta de Cloudflare: los archivos se guardan en `.almacenamiento-local/` (ignorado por git, o en `ALMACENAMIENTO_LOCAL_DIR`) y se sirven por `/api/almacenamiento-local/...`, que exige sesión y solo existe en este modo. La semilla genera una imagen PNG de prueba ("Tomo 12 · Folio 3") por cada folio de cada acta. En producción siempre se usa R2 y la falta de variables sigue siendo un error.

Usuarios locales (contraseña `password`):

| Correo | Rol | Ámbito |
|---|---|---|
| `admin@pais.local` | Admin País | Todo el país |
| `admin@regional.local` | Admin Regional | Región Central |
| `admin@escuela.local` | Admin Escuela | Escuela Central |
| `staff@local` | Staff | Escuela Central |

La semilla incluye más usuarios por región y escuela; `pnpm db:sembrar` imprime la lista completa.

---

## Estado

En arranque. La estructura de la aplicación (`app/`, `src/`, esquema Drizzle, etc.) aún no está creada — ver **[docs/initialize-project.md](docs/initialize-project.md)**.
