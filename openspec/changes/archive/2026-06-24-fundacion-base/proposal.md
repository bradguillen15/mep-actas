## Why

El proyecto `mep-actas` (Sistema de Consulta de Títulos del MEP, Costa Rica) no tiene aún una línea base de código. Antes de construir cualquier feature se necesita el andamiaje técnico: scaffold del proyecto, configuración de base de datos, autenticación, almacenamiento de archivos y documentación inicial. Sin esta fundación ningún agente puede escribir código que corra, se pruebe o se despliegue.

## What Changes

Se crea la estructura base del proyecto con 5 bloques + documentación:

- **Scaffold Next.js**: `package.json`, `tsconfig.json`, `next.config.ts`, Tailwind con tokens de diseño MEP, layout raíz, Vitest config
- **Drizzle + Turso**: esquema con las 15 tablas del BRD §10 (nombres en español), cliente de base de datos solo-servidor, migración inicial
- **Autenticación y roles**: NextAuth con JWT en httpOnly cookies, 4 roles jerárquicos, rate limiter en login (mitigación de fuerza bruta), servicio de autorización con verificación de nivel + ámbito
- **Cloudflare R2**: cliente S3-compatible, generación de URLs firmadas para lectura y subida, validación de tipos de archivo, key convention anti-path-traversal
- **Auditoría**: servicio de registro de auditoría como dependencia obligatoria para toda escritura (desde el día uno)
- **Documentación**: `docs/data-model.md`, `.env.example`, `docs/api-spec.yml` (stub)

Ningún cambio es **BREAKING** — no hay código previo.

## Capabilities

### New Capabilities
- `scaffold-proyecto`: Estructura base de Next.js con App Router, TypeScript, Tailwind y tokens de diseño MEP
- `base-datos`: Esquema Drizzle completo (15 tablas), cliente Turso y migración inicial
- `autenticacion-roles`: Autenticación con NextAuth (JWT), jerarquía de roles por nivel, autorización con verificación de ámbito, rate limiting en login
- `almacenamiento-r2`: Integración con Cloudflare R2 para escaneos de folios — URLs firmadas del lado del servidor
- `auditoria`: Servicio de registro de auditoría para toda operación de escritura

### Modified Capabilities
Ninguna — es el primer cambio del proyecto.

## Impact

- **Código nuevo**: `app/`, `src/db/`, `src/server/`, `components/`
- **Dependencias nuevas**: next, react, drizzle-orm, @libsql/client, next-auth, bcryptjs, zod, @aws-sdk/client-s3, tailwindcss
- **Dependencias de desarrollo**: vitest, drizzle-kit, typescript, @types/bcryptjs
- **Variables de entorno requeridas**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `LOGIN_RATE_LIMIT_MAX`
- **Sin cambios a sistemas existentes**: proyecto desde cero
