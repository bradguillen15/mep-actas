CREATE TABLE `acta_escaneos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acta_id` integer NOT NULL,
	`escaneo_id` integer NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`escaneo_id`) REFERENCES `escaneos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_acta_escaneos_acta_escaneo` ON `acta_escaneos` (`acta_id`,`escaneo_id`);--> statement-breakpoint
CREATE TABLE `acta_estudiantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acta_id` integer NOT NULL,
	`estudiante_id` integer NOT NULL,
	`numero_certificado` integer NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_acta_estudiantes_acta_id` ON `acta_estudiantes` (`acta_id`);--> statement-breakpoint
CREATE INDEX `idx_acta_estudiantes_estudiante_id` ON `acta_estudiantes` (`estudiante_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_acta_estudiantes_acta_estudiante` ON `acta_estudiantes` (`acta_id`,`estudiante_id`);--> statement-breakpoint
CREATE TABLE `acta_firmantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acta_id` integer NOT NULL,
	`funcionario_id` integer NOT NULL,
	`rol_firma` text NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_acta_firmantes_acta_id` ON `acta_firmantes` (`acta_id`);--> statement-breakpoint
CREATE INDEX `idx_acta_firmantes_funcionario_id` ON `acta_firmantes` (`funcionario_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_acta_firmantes_acta_funcionario_rol` ON `acta_firmantes` (`acta_id`,`funcionario_id`,`rol_firma`);--> statement-breakpoint
CREATE TABLE `actas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`escuela_id` integer NOT NULL,
	`tipo_acta_id` integer NOT NULL,
	`acta_referencia_id` integer,
	`titulo` text NOT NULL,
	`numero_tomo` integer NOT NULL,
	`folio_inicio` integer NOT NULL,
	`folio_fin` integer NOT NULL,
	`fecha` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`escuela_id`) REFERENCES `escuelas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tipo_acta_id`) REFERENCES `tipos_acta`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`acta_referencia_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "chk_actas_numero_tomo" CHECK("actas"."numero_tomo" > 0),
	CONSTRAINT "chk_actas_folio_inicio" CHECK("actas"."folio_inicio" > 0),
	CONSTRAINT "chk_actas_rango_folios" CHECK("actas"."folio_fin" >= "actas"."folio_inicio")
);
--> statement-breakpoint
CREATE INDEX `idx_actas_escuela_id` ON `actas` (`escuela_id`);--> statement-breakpoint
CREATE TABLE `auditoria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` integer NOT NULL,
	`tabla` text NOT NULL,
	`registro_id` integer NOT NULL,
	`accion` text NOT NULL,
	`datos_anteriores` text,
	`datos_nuevos` text,
	`escuela_id` integer,
	`region_id` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`escuela_id`) REFERENCES `escuelas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`region_id`) REFERENCES `regiones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_auditoria_escuela_id` ON `auditoria` (`escuela_id`);--> statement-breakpoint
CREATE INDEX `idx_auditoria_region_id` ON `auditoria` (`region_id`);--> statement-breakpoint
CREATE TABLE `escaneos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`escuela_id` integer NOT NULL,
	`numero_tomo` integer NOT NULL,
	`numero_folio` integer NOT NULL,
	`url` text NOT NULL,
	`formato` text NOT NULL,
	`uploaded_by` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`escuela_id`) REFERENCES `escuelas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "chk_escaneos_numero_tomo" CHECK("escaneos"."numero_tomo" > 0),
	CONSTRAINT "chk_escaneos_numero_folio" CHECK("escaneos"."numero_folio" > 0)
);
--> statement-breakpoint
CREATE INDEX `idx_escaneos_escuela_id` ON `escaneos` (`escuela_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_escaneos_escuela_tomo_folio` ON `escaneos` (`escuela_id`,`numero_tomo`,`numero_folio`);--> statement-breakpoint
CREATE TABLE `escuelas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`region_id` integer NOT NULL,
	`codigo_mep` text NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regiones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `escuelas_codigo_mep_unique` ON `escuelas` (`codigo_mep`);--> statement-breakpoint
CREATE INDEX `idx_escuelas_region_id` ON `escuelas` (`region_id`);--> statement-breakpoint
CREATE TABLE `estudiantes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`persona_id` integer NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estudiantes_persona_id_unique` ON `estudiantes` (`persona_id`);--> statement-breakpoint
CREATE TABLE `funcionario_escuela` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`funcionario_id` integer NOT NULL,
	`escuela_id` integer NOT NULL,
	FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`escuela_id`) REFERENCES `escuelas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_funcionario_escuela_funcionario_id` ON `funcionario_escuela` (`funcionario_id`);--> statement-breakpoint
CREATE INDEX `idx_funcionario_escuela_escuela_id` ON `funcionario_escuela` (`escuela_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_funcionario_escuela_par` ON `funcionario_escuela` (`funcionario_id`,`escuela_id`);--> statement-breakpoint
CREATE TABLE `funcionarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`persona_id` integer NOT NULL,
	`puesto` text NOT NULL,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `funcionarios_persona_id_unique` ON `funcionarios` (`persona_id`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`identificacion` text NOT NULL,
	`nombres` text NOT NULL,
	`apellidos` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_identificacion_unique` ON `personas` (`identificacion`);--> statement-breakpoint
CREATE TABLE `regiones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regiones_nombre_unique` ON `regiones` (`nombre`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`nivel` integer NOT NULL,
	CONSTRAINT "chk_roles_nivel" CHECK("roles"."nivel" >= 1 AND "roles"."nivel" <= 4)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_nombre_unique` ON `roles` (`nombre`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_nivel_unique` ON `roles` (`nivel`);--> statement-breakpoint
CREATE TABLE `tipos_acta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tipos_acta_nombre_unique` ON `tipos_acta` (`nombre`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`funcionario_id` integer NOT NULL,
	`rol_id` integer NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_funcionario_id_unique` ON `usuarios` (`funcionario_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);