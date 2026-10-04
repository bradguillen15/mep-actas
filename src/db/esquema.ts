import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  check,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

const defaultCreatedAt = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const regiones = sqliteTable("regiones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const escuelas = sqliteTable(
  "escuelas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    regionId: integer("region_id")
      .notNull()
      .references(() => regiones.id),
    codigoMep: text("codigo_mep").notNull().unique(),
    nombre: text("nombre").notNull(),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  },
  (tabla) => ({
    regionIdx: index("idx_escuelas_region_id").on(tabla.regionId),
  })
);

export const tiposActas = sqliteTable("tipos_acta", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const actas = sqliteTable(
  "actas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    escuelaId: integer("escuela_id")
      .notNull()
      .references(() => escuelas.id),
    tipoActaId: integer("tipo_acta_id")
      .notNull()
      .references(() => tiposActas.id),
    actaReferenciaId: integer("acta_referencia_id").references(
      (): AnySQLiteColumn => actas.id
    ),
    titulo: text("titulo").notNull(),
    numeroTomo: integer("numero_tomo").notNull(),
    folioInicio: integer("folio_inicio").notNull(),
    folioFin: integer("folio_fin").notNull(),
    fecha: text("fecha").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(defaultCreatedAt)
      .$defaultFn(() => new Date().toISOString()),
  },
  (tabla) => ({
    escuelaIdx: index("idx_actas_escuela_id").on(tabla.escuelaId),
    tomoPositivo: check("chk_actas_numero_tomo", sql`${tabla.numeroTomo} > 0`),
    folioInicioPositivo: check(
      "chk_actas_folio_inicio",
      sql`${tabla.folioInicio} > 0`
    ),
    rangoFolios: check(
      "chk_actas_rango_folios",
      sql`${tabla.folioFin} >= ${tabla.folioInicio}`
    ),
  })
);

export const personas = sqliteTable("personas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  identificacion: text("identificacion").notNull().unique(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
});

export const estudiantes = sqliteTable("estudiantes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personaId: integer("persona_id")
    .notNull()
    .unique()
    .references(() => personas.id),
});

export const actaEstudiantes = sqliteTable(
  "acta_estudiantes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actaId: integer("acta_id")
      .notNull()
      .references(() => actas.id),
    estudianteId: integer("estudiante_id")
      .notNull()
      .references(() => estudiantes.id),
    numeroCertificado: integer("numero_certificado").notNull(),
  },
  (tabla) => ({
    actaIdx: index("idx_acta_estudiantes_acta_id").on(tabla.actaId),
    estudianteIdx: index("idx_acta_estudiantes_estudiante_id").on(
      tabla.estudianteId
    ),
    unicoActaEstudiante: uniqueIndex("uq_acta_estudiantes_acta_estudiante").on(
      tabla.actaId,
      tabla.estudianteId
    ),
  })
);

export const escaneos = sqliteTable(
  "escaneos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    escuelaId: integer("escuela_id")
      .notNull()
      .references(() => escuelas.id),
    numeroTomo: integer("numero_tomo").notNull(),
    numeroFolio: integer("numero_folio").notNull(),
    url: text("url").notNull(),
    formato: text("formato").notNull(),
    uploadedBy: integer("uploaded_by")
      .notNull()
      .references(() => usuarios.id),
    createdAt: text("created_at")
      .notNull()
      .default(defaultCreatedAt)
      .$defaultFn(() => new Date().toISOString()),
  },
  (tabla) => ({
    escuelaIdx: index("idx_escaneos_escuela_id").on(tabla.escuelaId),
    unicoEscuelaTomoFolio: uniqueIndex("uq_escaneos_escuela_tomo_folio").on(
      tabla.escuelaId,
      tabla.numeroTomo,
      tabla.numeroFolio
    ),
    tomoPositivo: check(
      "chk_escaneos_numero_tomo",
      sql`${tabla.numeroTomo} > 0`
    ),
    folioPositivo: check(
      "chk_escaneos_numero_folio",
      sql`${tabla.numeroFolio} > 0`
    ),
  })
);

export const actaEscaneos = sqliteTable(
  "acta_escaneos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actaId: integer("acta_id")
      .notNull()
      .references(() => actas.id),
    escaneoId: integer("escaneo_id")
      .notNull()
      .references(() => escaneos.id),
  },
  (tabla) => ({
    unicoActaEscaneo: uniqueIndex("uq_acta_escaneos_acta_escaneo").on(
      tabla.actaId,
      tabla.escaneoId
    ),
  })
);

export const funcionarios = sqliteTable("funcionarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personaId: integer("persona_id")
    .notNull()
    .unique()
    .references(() => personas.id),
  puesto: text("puesto").notNull(),
});

export const funcionarioEscuela = sqliteTable(
  "funcionario_escuela",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    funcionarioId: integer("funcionario_id")
      .notNull()
      .references(() => funcionarios.id),
    escuelaId: integer("escuela_id")
      .notNull()
      .references(() => escuelas.id),
  },
  (tabla) => ({
    funcionarioIdx: index("idx_funcionario_escuela_funcionario_id").on(
      tabla.funcionarioId
    ),
    escuelaIdx: index("idx_funcionario_escuela_escuela_id").on(tabla.escuelaId),
    unicoPar: uniqueIndex("uq_funcionario_escuela_par").on(
      tabla.funcionarioId,
      tabla.escuelaId
    ),
  })
);

export const actaFirmantes = sqliteTable(
  "acta_firmantes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actaId: integer("acta_id")
      .notNull()
      .references(() => actas.id),
    funcionarioId: integer("funcionario_id")
      .notNull()
      .references(() => funcionarios.id),
    rolFirma: text("rol_firma").notNull(),
  },
  (tabla) => ({
    actaIdx: index("idx_acta_firmantes_acta_id").on(tabla.actaId),
    funcionarioIdx: index("idx_acta_firmantes_funcionario_id").on(
      tabla.funcionarioId
    ),
    unicoActaFuncionarioRol: uniqueIndex(
      "uq_acta_firmantes_acta_funcionario_rol"
    ).on(tabla.actaId, tabla.funcionarioId, tabla.rolFirma),
  })
);

export const roles = sqliteTable(
  "roles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull().unique(),
    nivel: integer("nivel").notNull().unique(),
  },
  (tabla) => ({
    nivelValido: check(
      "chk_roles_nivel",
      sql`${tabla.nivel} >= 1 AND ${tabla.nivel} <= 4`
    ),
  })
);

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  funcionarioId: integer("funcionario_id")
    .notNull()
    .unique()
    .references(() => funcionarios.id),
  rolId: integer("rol_id")
    .notNull()
    .references(() => roles.id),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const auditoria = sqliteTable(
  "auditoria",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    tabla: text("tabla").notNull(),
    registroId: integer("registro_id").notNull(),
    accion: text("accion").notNull(),
    datosAnteriores: text("datos_anteriores"),
    datosNuevos: text("datos_nuevos"),
    escuelaId: integer("escuela_id").references(() => escuelas.id),
    regionId: integer("region_id").references(() => regiones.id),
    createdAt: text("created_at")
      .notNull()
      .default(defaultCreatedAt)
      .$defaultFn(() => new Date().toISOString()),
  },
  (tabla) => ({
    escuelaIdx: index("idx_auditoria_escuela_id").on(tabla.escuelaId),
    regionIdx: index("idx_auditoria_region_id").on(tabla.regionId),
  })
);
