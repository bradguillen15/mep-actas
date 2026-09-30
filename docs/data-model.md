# Modelo de datos — Sistema de Consulta de Títulos del MEP

> Fuente: BRD §10. Este documento describe el modelo de dominio y la estructura de la base de datos.
> Última actualización: seguridad-alcance-escuela-region (columnas `escuela_id` y `region_id` en auditoría, índices de ámbito y control de acceso por ámbito).

## Principios de diseño

- **Nombres en español**: todas las tablas, columnas y relaciones usan español (Costa Rica).
- **Actas inmutables**: una vez creadas no se editan ni eliminan. Las correcciones se hacen con nuevas actas enlazadas via `acta_referencia_id`.
- **Auditoría obligatoria**: toda operación de escritura registra en la tabla `auditoria`.
- **Sin tomos/folios como entidades estructurales**: son campos de referencia para trazabilidad con el original físico.
- **Escaneos como recurso reutilizable**: un escaneo se administra independientemente y se vincula a múltiples actas sin duplicación.

## Diagrama de entidades

```
regiones
  └── escuelas (region_id)
        ├── actas (escuela_id)
        │     ├── acta_estudiantes (acta_id) ─── estudiantes (estudiante_id) ─── personas (persona_id)
        │     ├── acta_escaneos (acta_id) ─── escaneos (escaneo_id)
        │     └── acta_firmantes (acta_id) ─── funcionarios (funcionario_id) ─── personas (persona_id)
        └── escaneos (escuela_id)

usuarios ─── funcionarios (funcionario_id)
roles ─── usuarios (rol_id)

auditoria (independiente, solo lectura)
```

## Tablas

### Jerarquía geográfica

**regiones**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| nombre | TEXT | NOT NULL |
| activo | INTEGER (boolean) | NOT NULL, default true |

**escuelas**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| region_id | INTEGER | FK → regiones.id, NOT NULL |
| codigo_mep | TEXT | NOT NULL |
| nombre | TEXT | NOT NULL |
| activo | INTEGER (boolean) | NOT NULL, default true |

Índices: `idx_escuelas_region_id` sobre `region_id`.

### Actas y estudiantes

**tipos_acta**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| nombre | TEXT | NOT NULL (Graduación, Reposición, Corrección…) |
| activo | INTEGER (boolean) | NOT NULL, default true |

**actas** (inmutable)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| escuela_id | INTEGER | FK → escuelas.id, NOT NULL |
| tipo_acta_id | INTEGER | FK → tipos_acta.id, NOT NULL |
| acta_referencia_id | INTEGER | FK → actas.id, nullable |
| titulo | TEXT | NOT NULL |
| numero_tomo | INTEGER | NOT NULL |
| folio_inicio | INTEGER | NOT NULL |
| folio_fin | INTEGER | NOT NULL |
| fecha | TEXT (ISO-8601) | NOT NULL |
| created_at | TEXT (ISO-8601) | NOT NULL, default now |

Índices: `idx_actas_escuela_id` sobre `escuela_id`.

> Control de acceso: `POST /api/actas` exige nivel mínimo 4 (Staff). El `escuela_id` de la petición debe estar dentro del ámbito del actor: nivel 3–4, la escuela de su sesión; nivel 2, una escuela de su región (se valida contra la región de la escuela objetivo); nivel 1, cualquiera. Una escuela fuera del ámbito o inexistente responde `403`. Las consultas y escrituras por id sobre un acta fuera del ámbito responden `404`.

**personas**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| identificacion | TEXT | NOT NULL, UNIQUE, indexada |
| nombres | TEXT | NOT NULL |
| apellidos | TEXT | NOT NULL |

Índices: `idx_personas_identificacion` sobre `identificacion`.

> Control de acceso: una persona está en el ámbito si aparece como estudiante o firmante en un acta de una escuela del ámbito, o es funcionario asignado a una escuela del ámbito; las personas sin vínculo solo las ve el nivel 1. La consulta por identificación exacta (`GET /api/personas?identificacion=`) es la única excepción: cualquier usuario autenticado obtiene solo `id`, `nombres`, `apellidos` e `identificacion`.

**estudiantes**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| persona_id | INTEGER | FK → personas.id, NOT NULL |

Índices: `idx_estudiantes_persona_id` sobre `persona_id`.

**acta_estudiantes** (puente acta ↔ estudiante)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| acta_id | INTEGER | FK → actas.id, NOT NULL |
| estudiante_id | INTEGER | FK → estudiantes.id, NOT NULL |
| numero_certificado | INTEGER | NOT NULL |

Índices: `idx_acta_estudiantes_acta_id` sobre `acta_id` e `idx_acta_estudiantes_estudiante_id` sobre `estudiante_id`.

### Escaneos de folios

**escaneos** (recurso reutilizable)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| escuela_id | INTEGER | FK → escuelas.id, NOT NULL |
| numero_tomo | INTEGER | NOT NULL |
| numero_folio | INTEGER | NOT NULL |
| url | TEXT | NOT NULL (clave en R2) |
| formato | TEXT | NOT NULL |
| uploaded_by | INTEGER | FK → usuarios.id, NOT NULL |
| created_at | TEXT (ISO-8601) | NOT NULL, default now |

Índices: `idx_escaneos_escuela_id` sobre `escuela_id`.

> Control de acceso: `POST /api/escaneos` exige nivel mínimo 4 (Staff), con la misma restricción de ámbito por escuela descrita para `actas` (nivel 2 validado contra la región de la escuela objetivo; fuera de ámbito responde `403`). `GET` y `DELETE` por id sobre un escaneo fuera del ámbito responden `404`.

**acta_escaneos** (puente acta ↔ escaneo)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| acta_id | INTEGER | FK → actas.id, NOT NULL |
| escaneo_id | INTEGER | FK → escaneos.id, NOT NULL |

### Funcionarios, firmantes y usuarios

**funcionarios**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| persona_id | INTEGER | FK → personas.id, NOT NULL |
| puesto | TEXT | NOT NULL |

Índices: `idx_funcionarios_persona_id` sobre `persona_id`.

**funcionario_escuela** (un funcionario puede pertenecer a varias escuelas)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| funcionario_id | INTEGER | FK → funcionarios.id, NOT NULL |
| escuela_id | INTEGER | FK → escuelas.id, NOT NULL |

Índices: `idx_funcionario_escuela_funcionario_id` sobre `funcionario_id` e `idx_funcionario_escuela_escuela_id` sobre `escuela_id`.

> Control de acceso: un funcionario está en el ámbito según las escuelas que tiene asignadas en esta tabla; sin asignación solo lo ve el nivel 1.

**acta_firmantes** (funcionarios que firman un acta)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| acta_id | INTEGER | FK → actas.id, NOT NULL |
| funcionario_id | INTEGER | FK → funcionarios.id, NOT NULL |
| rol_firma | TEXT | NOT NULL |

Índices: `idx_acta_firmantes_acta_id` sobre `acta_id` e `idx_acta_firmantes_funcionario_id` sobre `funcionario_id`.

**roles**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| nombre | TEXT | NOT NULL |
| nivel | INTEGER | NOT NULL (1=País, 2=Regional, 3=Escuela, 4=Staff) |

**usuarios**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| funcionario_id | INTEGER | FK → funcionarios.id, NOT NULL |
| rol_id | INTEGER | FK → roles.id, NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL (bcrypt) |
| activo | INTEGER (boolean) | NOT NULL, default true |

> Control de acceso (jerarquía + ámbito): la creación y gestión de usuarios (crear, restablecer contraseña, activar/desactivar) exige que el `nivel` del rol destino sea igual o mayor (mismo nivel o inferior en privilegio) al del actor, y que el funcionario destino pertenezca a su ámbito — Admin Regional limitado a su `region_id`, Admin Escuela a su `escuela_id` (resuelto vía `funcionario_escuela` → `escuelas.region_id`), Admin País sin restricción. Una violación de jerarquía, o un funcionario destino fuera del ámbito al crear, responde `403`. En las rutas por id (restablecer contraseña, activar/desactivar) un usuario destino fuera del ámbito responde `404` (indistinguible de uno inexistente); la violación de jerarquía sobre un destino dentro del ámbito responde `403`.

### Auditoría

**auditoria** (solo lectura, INSERT exclusivamente)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| usuario_id | INTEGER | FK → usuarios.id, NOT NULL |
| tabla | TEXT | NOT NULL |
| registro_id | INTEGER | NOT NULL |
| accion | TEXT | NOT NULL (crear, editar, desactivar…) |
| datos_anteriores | TEXT (JSON) | Nullable |
| datos_nuevos | TEXT (JSON) | Nullable |
| escuela_id | INTEGER | FK → escuelas.id, nullable |
| region_id | INTEGER | FK → regiones.id, nullable |
| created_at | TEXT (ISO-8601) | NOT NULL, default now |

Índices: `idx_auditoria_escuela_id` sobre `escuela_id` e `idx_auditoria_region_id` sobre `region_id`.

> `escuela_id` y `region_id` se pueblan al escribir; si solo se informa la escuela, el auditor deriva la región de esa escuela. Las acciones regionales (p. ej. actualizar una región) llevan solo `region_id`; las nacionales (crear región, tipos de acta, personas, funcionarios) llevan ambos en `NULL`. Lectura: nivel 1 ve todo; nivel 2 ve las filas de su región (incluidas las regionales sin escuela); nivel 3–4, las de su escuela; las filas con ambos `NULL` solo las ve el nivel 1.

## Control de acceso por ámbito

Toda lectura y toda escritura sobre recursos existentes se limita al ámbito del usuario, derivado de su nivel: nivel 1, todo el país; nivel 2, las escuelas de su región (`escuelas.region_id`); nivel 3–4, su escuela. Los listados excluyen sin error los registros fuera del ámbito y las rutas por id responden `404` con el mismo cuerpo que un recurso inexistente. Los filtros del cliente (`escuelaId`, etc.) solo pueden estrechar el resultado. Una sesión sin escuela o región válida no ve nada (falla cerrado).

## Convenciones

- **Fechas**: formato ISO-8601 (texto) — `2025-06-24T12:00:00.000Z`
- **Booleanos**: INTEGER 0/1 (SQLite no tiene boolean nativo)
- **Claves foráneas**: declaradas explícitamente en el esquema Drizzle
- **Índices**: en columnas de búsqueda frecuente (`identificacion`, `escuela_id`) y en las usadas por las condiciones de ámbito (`region_id`, claves de las tablas puente)
- **Auto-incremental**: SQLite asigna automáticamente para columnas INTEGER PK
