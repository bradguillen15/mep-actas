## 0. Preparación: crear rama de feature (completado)

- [x] 0.1 Crear rama `feature/jerarquia-geografica` desde `feature/fundacion-base`
- [x] 0.2 Verificar la rama activa

## 1. Migración: agregar columna activo a regiones y escuelas

- [x] 1.1 Agregar columna `activo` (integer, default 1) a `regiones` y `escuelas` en `src/db/esquema.ts`
- [x] 1.2 Generar migración con `drizzle-kit generate`
- [x] 1.3 Actualizar `docs/data-model.md` con la nueva columna

## 2. Backend: repositorio de regiones (TDD)

- [x] 2.1 Escribir prueba que falla para `regiones.repositorio.ts`: listar, obtener por id, crear, actualizar, desactivar
- [x] 2.2 Implementar `src/server/repositorios/regiones.repositorio.ts`

## 3. Backend: repositorio de escuelas (TDD)

- [x] 3.1 Escribir prueba que falla para `escuelas.repositorio.ts`: listar (con filtro por region_id), obtener por id, crear, actualizar, desactivar
- [x] 3.2 Implementar `src/server/repositorios/escuelas.repositorio.ts`

## 4. Backend: servicio de regiones (TDD)

- [x] 4.1 Escribir prueba que falla para `regiones.servicio.ts`: crear con validación de unicidad, listar, editar, desactivar
- [x] 4.2 Implementar `src/server/servicios/regiones.servicio.ts`

## 5. Backend: servicio de escuelas (TDD)

- [x] 5.1 Escribir prueba que falla para `escuelas.servicio.ts`: crear con validación de ámbito, listar con filtro, editar, desactivar con verificación de actas
- [x] 5.2 Implementar `src/server/servicios/escuelas.servicio.ts`

## 6. Backend: route handlers de regiones (TDD)

- [x] 6.1 Escribir prueba que falla para `app/api/regiones/route.ts`: GET, POST, PATCH, DELETE con control de acceso
- [x] 6.2 Implementar route handler de regiones con validación Zod y autorización

## 7. Backend: route handlers de escuelas (TDD)

- [x] 7.1 Escribir prueba que falla para `app/api/escuelas/route.ts`: GET, POST, PATCH, DELETE con control de acceso y ámbito
- [x] 7.2 Implementar route handler de escuelas con validación Zod y autorización

## 8. Ejecutar pruebas (Vitest)

- [x] 8.1 Ejecutar todas las pruebas con `pnpm test`
- [x] 8.2 Corregir fallas y dejar todas en verde
- [x] 8.3 Restaurar estado de base de datos si alguna prueba escribió

## 9. Documentación

- [x] 9.1 Actualizar `docs/api-spec.yml` con los endpoints de regiones y escuelas
- [x] 9.2 Actualizar `docs/data-model.md` si cambió el esquema
