## 0. Preparación: crear rama de feature

- [x] 0.1 Crear rama `feature/fundacion-base` desde main
- [x] 0.2 Verificar la rama activa

## 1. Scaffold de Next.js con tokens de diseño MEP

- [x] 1.1 Inicializar proyecto Next.js con `create-next-app`, App Router, TypeScript, Tailwind, src/ directory
- [x] 1.2 Configurar `tsconfig.json` con modo estricto y paths `@/*` apuntando a `src/*`
- [x] 1.3 Definir variables CSS de identidad MEP en `app/globals.css` (BRD §9.3): `--color-primario`, `--color-primario-hover`, `--color-acento`, `--color-acento-suave`, `--color-fondo`, `--color-superficie`, `--color-borde`, `--color-texto`, `--color-exito`, `--color-error`. Sin colores embebidos.
- [x] 1.4 Extender `tailwind.config.ts` con los colores MEP como tokens con nombre en `theme.extend.colors`
- [x] 1.5 Crear `app/layout.tsx` con `"use client"`, tipografía Inter, metadata mínima, estructura de directorios vacía (`app/api/`, `components/ui/`, `src/server/`, `src/db/`)
- [x] 1.6 Configurar `vitest.config.ts` con entorno jsdom, soporte TypeScript y JSX
- [x] 1.7 Escribir prueba Vitest de verificación: comprueba que las variables CSS existen en `globals.css`

## 2. Drizzle + Turso: esquema y cliente de base de datos

- [x] 2.1 Instalar dependencias: `drizzle-orm`, `@libsql/client`, `drizzle-kit` (dev), `@types/better-sqlite3` (dev)
- [x] 2.2 Escribir prueba que falla: verifica que `src/db/esquema.ts` exporta las 15 tablas con nombres correctos
- [x] 2.3 Crear `src/db/esquema.ts` con las 15 tablas del BRD §10 usando `drizzle-orm/sqlite-core`, nombres en español, claves foráneas explícitas, índices en `personas.identificacion`, `actas.escuela_id`, `escaneos.escuela_id`
- [x] 2.4 Crear `src/db/cliente.ts` que exporta una función `clienteDb()` que retorna una instancia de drizzle sobre Turso
- [x] 2.5 Crear `drizzle.config.ts` apuntando a Turso con esquema en `src/db/esquema.ts`
- [x] 2.6 Generar migración inicial con `npx drizzle-kit generate` y verificar que se crea en `drizzle/`
- [x] 2.7 Escribir prueba Vitest: verifica que el cliente se inicializa correctamente con variables de entorno mock

## 3. NextAuth: autenticación con JWT en httpOnly cookies + SRP

- [x] 3.1 Instalar dependencias: `next-auth`, `bcryptjs`, `@types/bcryptjs` (dev)
- [x] 3.2 Crear `src/server/auth/tipos.ts` con tipos: `SesionUsuario`, `NivelRol` (1|2|3|4), `AmbitoVerificacion`, `ResultadoVerificacion`
- [x] 3.3 Escribir prueba que falla para `sesion.servicio.ts`: `obtenerSesion()` retorna sesión o lanza 401
- [x] 3.4 Implementar `sesion.servicio.ts` con `obtenerSesion()` que envuelve `getServerSession`
- [x] 3.5 Escribir prueba que falla para `autorizacion.servicio.ts`: casos de nivel suficiente, nivel insuficiente, ámbito correcto, ámbito incorrecto
- [x] 3.6 Implementar `autorizacion.servicio.ts` con `verificarRol(sesion, nivelMinimo, ambito?)` que verifica nivel jerárquico (≤ nivelMinimo) y ámbito (escuela/región)
- [x] 3.7 Escribir prueba que falla para rate limiter: después de N intentos en ventana, responde 429
- [x] 3.8 Implementar rate limiter en memoria con ventana deslizante, configurable via `LOGIN_RATE_LIMIT_MAX`, headers `Retry-After`
- [x] 3.9 Crear `auth.config.ts` con opciones de NextAuth: JWT strategy, httpOnly+Secure+SameSite cookies, callback JWT que inyecta `rol_id`, `nivel`, `usuario_id`
- [x] 3.10 Verificar que las pruebas del bloque 3 pasan

## 4. Cloudflare R2: cliente y URLs firmadas

- [x] 4.1 Instalar dependencias: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- [x] 4.2 Escribir prueba que falla para `r2.cliente.ts`: cliente se inicializa con variables de entorno, error si faltan
- [x] 4.3 Implementar `r2.cliente.ts`: inicializa `S3Client` con endpoint de R2, credentials desde entorno. Error con mensaje claro si faltan variables.
- [x] 4.4 Escribir prueba que falla para `r2.util.ts`: generar URL firmada de lectura, URL de subida con Content-Type, construir clave con convención
- [x] 4.5 Implementar `generarUrlLectura(clave, ttl)` y `generarUrlSubida(clave, ttl, tipo)` con `@aws-sdk/s3-request-presigner`
- [x] 4.6 Implementar `construirClave(escuelaId, tomo, folio, extension)` con validación y sanitización anti-path-traversal
- [x] 4.7 Verificar que las pruebas del bloque 4 pasan

## 5. Servicio de auditoría (obligatorio desde el día uno)

- [x] 5.1 Escribir prueba que falla para `auditoria.repositorio.ts`: inserta registro en auditoria y verifica contenido
- [x] 5.2 Implementar `auditoria.repositorio.ts` con función `insertarRegistroAuditoria(db, datos)`
- [x] 5.3 Escribir prueba que falla para `auditoria.servicio.ts`: registra creación con datos anteriores/nuevos
- [x] 5.4 Implementar `auditoria.servicio.ts` con función `registrarAuditoria(params)` que recibe `usuario_id`, `tabla`, `registro_id`, `accion`, `datos_anteriores`, `datos_nuevos`
- [x] 5.5 Verificar que las pruebas del bloque 5 pasan

## 6. Ejecutar suite completa de pruebas (Vitest)

- [x] 6.1 Ejecutar todas las pruebas con `npx vitest run`
- [x] 6.2 Corregir cualquier falla y dejar todas las pruebas en verde
- [x] 6.3 Restaurar estado de base de datos si alguna prueba escribió

## 7. Documentación técnica

- [x] 7.1 Crear `docs/data-model.md` con el modelo de datos completo derivado del BRD §10, incluyendo diagrama de entidades y decisiones de diseño
- [x] 7.2 Crear `.env.example` con todas las variables de entorno: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `LOGIN_RATE_LIMIT_MAX`
- [x] 7.3 Crear `docs/api-spec.yml` con estructura base de endpoints (stub inicial)
- [x] 7.4 Verificar que `.env.example` no contiene secretos reales
