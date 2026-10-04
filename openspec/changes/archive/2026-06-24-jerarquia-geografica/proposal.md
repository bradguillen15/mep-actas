## Why

El sistema necesita la estructura geográfica (regiones y escuelas del MEP) para que las actas, usuarios y escaneos puedan asociarse a una escuela. Sin esta jerarquía no se puede crear ningún otro registro. Es el primer feature transaccional después de la fundación.

## What Changes

- CRUD completo de **regiones** (crear, listar, editar — sin borrado físico, solo desactivación) con autorización exclusiva para Admin País
- CRUD completo de **escuelas** asociadas a una región (crear, listar, editar, desactivar) con autorización para Admin País (todas) y Admin Regional (solo su región)
- Endpoints de listado público para cascadas UI (regiones → escuelas por región)
- Pruebas de servicio + repositorio con Vitest

Ningún cambio es **BREAKING** — no existían estos endpoints antes.

## Capabilities

### New Capabilities
- `gestion-regiones`: CRUD de regiones del MEP con control de acceso por rol
- `gestion-escuelas`: CRUD de escuelas asociadas a regiones con control de acceso por ámbito

### Modified Capabilities
Ninguna.

## Impact

- **Nuevos archivos**: `app/api/regiones/route.ts`, `app/api/escuelas/route.ts`, `src/server/servicios/regiones.servicio.ts`, `src/server/servicios/escuelas.servicio.ts`, `src/server/repositorios/regiones.repositorio.ts`, `src/server/repositorios/escuelas.repositorio.ts`
- **Dependencias nuevas**: Zod (ya instalado)
- **Sin cambios al esquema de base de datos**: tablas `regiones` y `escuelas` ya existen
- **Pruebas**: archivos `*.test.ts` para servicios, repositorios y route handlers
