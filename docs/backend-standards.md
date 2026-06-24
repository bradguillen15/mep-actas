---
description: Estándares de backend del Sistema de Consulta de Títulos del MEP — Next.js (App Router), arquitectura por capas pragmática, Drizzle ORM sobre Turso (libSQL), NextAuth, Cloudflare R2, pruebas con Vitest. Todo en español.
globs: ["app/api/**/*.ts", "src/server/**/*.ts", "src/db/**/*.ts", "drizzle/**/*.ts", "drizzle.config.ts", "vitest.config.ts"]
alwaysApply: true
---

# Estándares de Backend

> Producto del Gobierno de Costa Rica. **Todo el código, comentarios, nombres de tablas/columnas, mensajes y documentación van en español.** Solo se mantienen en inglés las palabras reservadas de lenguajes/frameworks y los nombres de paquetes de terceros.

## 1. Stack

- **Framework:** Next.js (App Router). El backend son los route handlers en `app/api/**/route.ts`. Frontend y backend en un solo proyecto.
- **Lenguaje:** TypeScript en modo estricto.
- **Base de datos:** Turso (libSQL / SQLite gestionado) con **Drizzle ORM** y `drizzle-kit` para migraciones.
- **Autenticación:** NextAuth (estrategia JWT). Contraseñas con bcrypt.
- **Archivos:** Cloudflare R2 (compatible con S3) para escaneos de folios, con URLs firmadas generadas en el servidor.
- **Despliegue:** Vercel. Secretos en variables de entorno del servidor.
- **Pruebas:** Vitest (unitarias/servicios) y Playwright (E2E). Cobertura pragmática, sin umbral fijo.

## 2. Arquitectura por capas (pragmática)

```
Petición → Route handler (app/api)  →  Servicio  →  Repositorio (Drizzle)  →  Turso
                 (presentación/API)     (negocio)      (acceso a datos)
```

- **Route handler** (`app/api/**/route.ts`): manejador delgado. Verifica sesión y rol, valida la entrada, llama al servicio, mapea el resultado a una respuesta HTTP. **No** accede a la base de datos directamente.
- **Servicio**: contiene la lógica de negocio y las reglas del dominio. Orquesta repositorios y registra auditoría. No arma respuestas HTTP.
- **Repositorio**: aísla todas las consultas de Drizzle. Es el único lugar que toca el cliente de la base.
- Se mantiene la separación de responsabilidades y el dominio tipado, **sin** la ceremonia completa de DDD (sin `entity.save()`, sin 4 capas formales).

### Estructura de carpetas sugerida
```
app/api/<recurso>/route.ts        # endpoints (GET/POST/…)
src/server/servicios/             # lógica de negocio (p. ej. actas.servicio.ts)
src/server/repositorios/          # acceso a datos con Drizzle (p. ej. actas.repositorio.ts)
src/db/esquema.ts                 # esquema Drizzle (tablas/columnas en español)
src/db/cliente.ts                 # cliente libSQL/Drizzle (solo servidor)
src/server/auth/                  # configuración de NextAuth, verificación de rol
src/server/almacenamiento/        # firma de URLs de Cloudflare R2
```

## 3. Base de datos (Drizzle + Turso)

- Define el esquema en `src/db/esquema.ts` con `drizzle-orm/sqlite-core`. **Nombres de tablas y columnas en español** (`actas`, `numero_tomo`, `acta_referencia_id`).
- El cliente de la base vive solo en el servidor (`src/db/cliente.ts`); nunca se importa desde código de cliente.
- Particularidades de SQLite/libSQL:
  - Sin tipo nativo de fecha: usa `text` ISO-8601 o `integer` (timestamp). Sé consistente.
  - Booleanos como `integer` (0/1).
  - Declara claves foráneas y **índices** para las columnas de búsqueda (p. ej. `personas.identificacion`).
- Migraciones con `drizzle-kit` (generar + aplicar). El esquema es la fuente de verdad junto a `docs/data-model.md`; actualiza ambos al cambiar datos.
- Transforma errores de la base (p. ej. violación de unicidad) en errores de dominio con significado.

## 4. API (route handlers)

- Un archivo `route.ts` por recurso; exporta funciones por verbo HTTP (`GET`, `POST`, `PATCH`, `DELETE`).
- Orden dentro del handler: **verificar sesión → verificar rol → validar entrada → llamar al servicio → responder**.
- Validación de entrada con un esquema (p. ej. Zod) en el límite del API. Nunca confíes en el cliente.
- Respuestas:
  - Éxito: JSON con el recurso y código `200`/`201`.
  - Error: cuerpo JSON consistente `{ "error": { "codigo": "...", "mensaje": "..." } }` (mensaje en español).
- Mapeo de estados HTTP:
  - `400` entrada inválida · `401` sin sesión · `403` rol insuficiente · `404` no encontrado · `409` conflicto (p. ej. unicidad) · `500` error interno.

## 5. Autenticación y autorización

- NextAuth con JWT; el rol del usuario viaja en el token/sesión.
- Roles jerárquicos por nivel: **Admin País (1) > Admin Regional (2) > Admin Escuela (3) > Staff (4)**.
- Cada endpoint declara y verifica el nivel/ámbito mínimo requerido **en el servidor**, en cada petición (no confíes en lo que oculte la UI).
- Un nivel superior puede crear/desactivar/restablecer contraseña de niveles iguales o inferiores dentro de su ámbito (país/región/escuela).
- Sin auto-registro: las cuentas se crean por invitación desde un nivel superior. El primer arranque crea el primer Admin País mediante asistente (sin credenciales por defecto).
- Contraseñas siempre con bcrypt; nunca texto plano; nunca las devuelvas en respuestas.

## 6. Almacenamiento de archivos (Cloudflare R2)

- Las credenciales de R2 viven solo en el servidor (variables de entorno de Vercel).
- El navegador **nunca** recibe credenciales: el servidor genera **URLs firmadas de corta duración** para subir y para leer los escaneos.
- Un folio se escanea una sola vez; el registro en `escaneos` guarda la clave/URL del objeto y se reutiliza vía la tabla puente `acta_escaneos` (sin duplicar la imagen).
- Se fuerza una convención de formato/nombres consistente al subir (escuela + tomo + folio).

## 7. Auditoría (obligatoria)

- **Toda** operación de escritura (crear/editar/desactivar) registra en `auditoria`: `usuario_id`, `tabla`, `registro_id`, `accion`, `datos_anteriores` (JSON), `datos_nuevos` (JSON), `created_at`.
- La auditoría es de **solo lectura**: ningún endpoint permite modificarla o eliminarla.
- Implementa el registro de auditoría en la capa de servicios, dentro de la misma transacción que la escritura cuando sea posible.

## 8. Pruebas (Vitest)

- TDD: escribe primero la prueba que falla, luego implementa hasta ponerla en verde.
- Prueba servicios y repositorios con datos de prueba; patrón AAA; nombres descriptivos en español.
- Las pruebas que escriben deben **restaurar el estado** de la base al terminar.
- Cubre: caso de éxito, errores de validación, no encontrado (`404`), conflicto de unicidad, y verificación de rol.
- Cobertura pragmática del dominio y los servicios; **sin** umbral fijo del 90%. No se usa "curl manual": la API se prueba con pruebas de route handlers/servicios y E2E con Playwright cuando cambia un flujo de usuario.

## 9. Seguridad

- Sistema cerrado: todo endpoint exige sesión válida salvo el de inicio de sesión.
- Validación de entrada en el límite del API; nunca interpoles entrada del usuario en consultas (Drizzle parametriza por defecto).
- Secretos (token de Turso, credenciales de R2, secreto de NextAuth) solo en el servidor; nunca con prefijo `NEXT_PUBLIC_`.
- Cumplimiento de la Ley 8968 (protección de datos personales): minimiza la exposición de datos personales en respuestas y logs.

## 10. Documentación

- Cambios de datos → actualiza `docs/data-model.md` y el esquema Drizzle.
- Cambios de API → actualiza `docs/api-spec.yml`.
- Toda la documentación en español. Referencia los requisitos en `docs/brd.md`.
