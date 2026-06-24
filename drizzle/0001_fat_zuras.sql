PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_actas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`escuela_id` integer NOT NULL,
	`tipo_acta_id` integer NOT NULL,
	`acta_referencia_id` integer,
	`titulo` text NOT NULL,
	`numero_tomo` integer NOT NULL,
	`folio_inicio` integer NOT NULL,
	`folio_fin` integer NOT NULL,
	`fecha` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`escuela_id`) REFERENCES `escuelas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tipo_acta_id`) REFERENCES `tipos_acta`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_actas`("id", "escuela_id", "tipo_acta_id", "acta_referencia_id", "titulo", "numero_tomo", "folio_inicio", "folio_fin", "fecha", "created_at") SELECT "id", "escuela_id", "tipo_acta_id", "acta_referencia_id", "titulo", "numero_tomo", "folio_inicio", "folio_fin", "fecha", "created_at" FROM `actas`;--> statement-breakpoint
DROP TABLE `actas`;--> statement-breakpoint
ALTER TABLE `__new_actas` RENAME TO `actas`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_actas_escuela_id` ON `actas` (`escuela_id`);--> statement-breakpoint
ALTER TABLE `escuelas` ADD `activo` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `regiones` ADD `activo` integer DEFAULT true NOT NULL;