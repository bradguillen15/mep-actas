# Modelo de datos — Sistema de Consulta de Títulos del MEP

> Fuente: BRD §10. Este documento describe el modelo de dominio y la estructura de la base de datos.
> Última actualización: fundación del proyecto.

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

**escuelas**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| region_id | INTEGER | FK → regiones.id, NOT NULL |
| codigo_mep | TEXT | NOT NULL |
| nombre | TEXT | NOT NULL |

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

**personas**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| identificacion | TEXT | NOT NULL, UNIQUE, indexada |
| nombres | TEXT | NOT NULL |
| apellidos | TEXT | NOT NULL |

Índices: `idx_personas_identificacion` sobre `identificacion`.

**estudiantes**
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| persona_id | INTEGER | FK → personas.id, NOT NULL |

**acta_estudiantes** (puente acta ↔ estudiante)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| acta_id | INTEGER | FK → actas.id, NOT NULL |
| estudiante_id | INTEGER | FK → estudiantes.id, NOT NULL |
| numero_certificado | INTEGER | NOT NULL |

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

**funcionario_escuela** (un funcionario puede pertenecer a varias escuelas)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| funcionario_id | INTEGER | FK → funcionarios.id, NOT NULL |
| escuela_id | INTEGER | FK → escuelas.id, NOT NULL |

**acta_firmantes** (funcionarios que firman un acta)
| Columna | Tipo | Restricciones |
|---|---|---|
| id | INTEGER | PK, auto-incremental |
| acta_id | INTEGER | FK → actas.id, NOT NULL |
| funcionario_id | INTEGER | FK → funcionarios.id, NOT NULL |
| rol_firma | TEXT | NOT NULL |

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
| created_at | TEXT (ISO-8601) | NOT NULL, default now |

## Convenciones

- **Fechas**: formato ISO-8601 (texto) — `2025-06-24T12:00:00.000Z`
- **Booleanos**: INTEGER 0/1 (SQLite no tiene boolean nativo)
- **Claves foráneas**: declaradas explícitamente en el esquema Drizzle
- **Índices**: en columnas de búsqueda frecuente (`identificacion`, `escuela_id`)
- **Auto-incremental**: SQLite asigna automáticamente para columnas INTEGER PK
