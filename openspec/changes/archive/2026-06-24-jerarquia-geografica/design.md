## Context

Ya existe el esquema Drizzle con las tablas `regiones` y `escuelas`, el cliente de base de datos, y el sistema de autorización con verificación de rol + ámbito. Este feature implementa los endpoints CRUD para regiones y escuelas con la arquitectura de 3 capas.

## Goals / Non-Goals

**Goals:**
- CRUD completo de regiones (solo Admin País)
- CRUD completo de escuelas (Admin País todas, Admin Regional su región)
- Listados con filtro por región
- Pruebas Vitest para servicios, repositorios y route handlers
- Validación con Zod en todos los endpoints

**Non-Goals:**
- No se implementa UI frontend (solo API route handlers)
- No hay paginación en listados (volumen esperado bajo para el piloto)
- No hay endpoints de activación (se puede hacer vía PATCH con `activo: true`)

## Decisions

### Borrado lógico (desactivación) en vez de borrado físico
**Decisión:** Usar `activo: boolean` (integer 0/1) para desactivar regiones y escuelas.

Tablas actuales no tienen columna `activo`. Se agrega mediante migración Drizzle.

### Validación con Zod en el route handler
**Decisión:** Cada route handler valida el body de entrada contra un esquema Zod antes de llamar al servicio. Los errores de validación retornan 400 con mensajes en español.

### Verificación de ámbito en escuelas
**Decisión:** Admin Regional solo opera dentro de su `region_id`. El `verificarRol` existente acepta `{ regionId }` como ámbito. Admin Escuela y Staff no pueden crear/editar escuelas (solo verificarRol con nivel 2).

### DTOs de respuesta
**Decisión:** Los endpoints devuelven objetos planos sin relaciones anidadas por ahora. Si se necesita la región dentro de la escuela, se agrega en una iteración posterior.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| Admin Regional podría crear escuelas en otra región si el token no incluye region_id | El token JWT incluye `region_id` y el ámbito se verifica en `verificarRol` |
| Desactivar región con escuelas activas: la UI no debe permitirlo, pero el backend también lo bloquea | Validación en el servicio antes de desactivar |
| Código MEP no tiene formato definido en el BRD | Se guarda como texto libre, validación solo de unicidad y no vacío |
