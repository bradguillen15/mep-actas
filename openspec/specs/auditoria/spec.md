# auditoria Specification

## Purpose
Define el registro de auditoría de solo inserción para toda operación de escritura del sistema.

## Requirements

### Requirement: Registro de auditoría para toda escritura
Toda operación de escritura (crear, editar, desactivar) SHALL registrar en la tabla `auditoria`: `usuario_id`, `tabla`, `registro_id`, `accion`, `datos_anteriores` (JSON), `datos_nuevos` (JSON), `created_at`.

#### Scenario: El servicio de auditoría registra una creación
- **WHEN** se llama a `registrarAuditoria({ usuario_id: 1, tabla: "actas", registro_id: 10, accion: "crear", datos_anteriores: null, datos_nuevos: { titulo: "Acta 2025" } })`
- **THEN** la tabla `auditoria` contiene un nuevo registro con esos datos

### Requirement: Auditoría como dependencia obligatoria
El servicio de auditoría SHALL ser una dependencia explícita en los servicios de escritura. No SHALL ser posible ejecutar una escritura sin proveer un `Auditor`.

#### Scenario: El servicio de actas recibe un auditor
- **WHEN** se inspecciona la función `crearActa`
- **THEN** acepta un parámetro `auditor` que es el servicio de registro de auditoría

### Requirement: Auditoría de solo lectura
La tabla `auditoria` SHALL ser de solo lectura: no SHALL existir endpoints para modificar o eliminar registros de auditoría.

#### Scenario: No hay endpoint de modificación de auditoría
- **WHEN** se inspeccionan los route handlers
- **THEN** no existe ningún método PATCH, PUT o DELETE para `auditoria`

### Requirement: Repositorio de auditoría aislado
El acceso a la tabla `auditoria` SHALL estar encapsulado en `src/server/repositorios/auditoria.repositorio.ts`. Ningún otro módulo SHALL escribir directamente en `auditoria`.

#### Scenario: El repositorio de auditoría existe
- **WHEN** se inspecciona `src/server/repositorios/auditoria.repositorio.ts`
- **THEN** exporta una función `insertarRegistroAuditoria(db, datos)` que inserta en la tabla auditoria
