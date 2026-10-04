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

El diagrama entidad-relación de la base de datos está en Mermaid dentro de [`docs/data-model.md`](docs/data-model.md#diagrama-de-entidades); GitHub lo renderiza sin enlaces externos.

---

## Funcionalidades

| Página | Qué permite |
|---|---|
| `/consultar` | Buscar graduados por nombre o número de identificación, con filtros por fechas y escuela. |
| `/actas` | Listar, crear y editar actas de graduación junto con sus estudiantes (un solo flujo de dos columnas). |
| `/tomos` | Explorar los folios digitalizados por escuela y tomo, verlos a pantalla completa y subir nuevos escaneos. |
| `/auditoria` | Revisar el historial de cambios con los datos anteriores y nuevos de cada registro. |
| `/usuarios` | Gestionar las cuentas dentro del ámbito del administrador (solo administradores). |
| `/configuracion` | Administrar tipos de acta, regiones y escuelas (solo administradores). |
| `/ayuda` | Manual de usuario integrado. |

### Roles y ámbito

Los roles siguen la jerarquía del MEP; cada persona solo ve y modifica lo que está dentro de su ámbito:

- **Admin País**: todo el país.
- **Admin Regional**: las escuelas de su región.
- **Admin Escuela**: su escuela.
- **Staff**: registra y corrige actas, consulta graduados y digitaliza folios de su escuela.

La regla completa de autorización está en el diagrama [Alcance por escuela y región](https://htmlpreview.github.io/?https://github.com/bradguillen15/mep-actas/blob/main/docs/arquitectura/alcance-escuela-region/alcance-escuela-region.html) y en el [BRD](docs/brd.md).

---

## Documentación

- **[docs/brd.md](docs/brd.md)** — requerimientos de negocio (fuente de verdad).
- **[docs/base-standards.md](docs/base-standards.md)** — principios, TDD, idioma.
- **[docs/backend-standards.md](docs/backend-standards.md)** — API, Drizzle/Turso, seguridad, pruebas.
- **[docs/frontend-standards.md](docs/frontend-standards.md)** — Next.js/React, estado, identidad MEP.
- **[docs/data-model.md](docs/data-model.md)** — modelo de datos y diagrama entidad-relación.
- **[docs/api-spec.yml](docs/api-spec.yml)** — especificación OpenAPI de la API.
- **[docs/documentation-standards.md](docs/documentation-standards.md)** — estándares de documentación.
- **[docs/openspec-tasks-mandatory-steps.md](docs/openspec-tasks-mandatory-steps.md)** — pasos obligatorios al crear `tasks.md` de OpenSpec.

### Desarrollo guiado por specs con IA

Este proyecto usa [Gentle AI](https://github.com/Gentleman-Programming/gentle-ai) (SDD) con persistencia `openspec`; los artefactos viven en `openspec/`:

```
/gentle-sdd-new → /gentle-sdd-ff → /gentle-sdd-apply → /gentle-sdd-verify → /gentle-sdd-archive
```

Requiere Gentle AI instalado globalmente (`gentle-ai install`). Ver la sección 4 de [CLAUDE.md](CLAUDE.md).

---

## Desarrollo local

Requisitos: Node.js 22 y pnpm.

```bash
pnpm install
pnpm dev:local
```

`pnpm dev:local` funciona sin credenciales de Turso ni R2. Para trabajar contra Turso o R2, copie `.env.example` a `.env.local` y complete las credenciales (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXTAUTH_SECRET` y las variables `R2_*`); `.env.local` está ignorado por git.

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

## Verificación y CI

| Comando | Qué ejecuta |
|---|---|
| `pnpm verify:fast` | lint, typecheck y pruebas unitarias |
| `pnpm verify` | `verify:fast` más las pruebas E2E |
| `sh scripts/verificar-ci.sh` | la verificación completa de CI (`verify:ci`: lint, typecheck, unitarias, semilla, build y E2E) con el mismo entorno que GitHub Actions |

Los hooks de Husky corren `verify:fast` en cada commit y `scripts/verificar-ci.sh` en cada push, así lo que pasa localmente pasa también en CI.

- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): corre `scripts/verificar-ci.sh` en cada pull request.
- **CD** ([`.github/workflows/cd.yml`](.github/workflows/cd.yml)): en cada push a `main`, vuelve a correr CI y, si pasa, despliega a producción en Vercel.
- **Revisión de código**: [CodeRabbit](https://coderabbit.ai) revisa cada pull request en español (configuración en [`.coderabbit.yaml`](.coderabbit.yaml)).
- **Rama `main` protegida**: solo recibe cambios por pull request; no admite push directo ni force-push.

---

## Estado

Piloto funcional: autenticación con roles y ámbito, registro y edición de actas, consulta de graduados, digitalización de folios, auditoría, gestión de usuarios y configuración de catálogos.
