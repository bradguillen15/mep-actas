CREATE INDEX `idx_acta_estudiantes_acta_id` ON `acta_estudiantes` (`acta_id`);--> statement-breakpoint
CREATE INDEX `idx_acta_estudiantes_estudiante_id` ON `acta_estudiantes` (`estudiante_id`);--> statement-breakpoint
CREATE INDEX `idx_acta_firmantes_acta_id` ON `acta_firmantes` (`acta_id`);--> statement-breakpoint
CREATE INDEX `idx_acta_firmantes_funcionario_id` ON `acta_firmantes` (`funcionario_id`);--> statement-breakpoint
CREATE INDEX `idx_escuelas_region_id` ON `escuelas` (`region_id`);--> statement-breakpoint
CREATE INDEX `idx_estudiantes_persona_id` ON `estudiantes` (`persona_id`);--> statement-breakpoint
CREATE INDEX `idx_funcionario_escuela_funcionario_id` ON `funcionario_escuela` (`funcionario_id`);--> statement-breakpoint
CREATE INDEX `idx_funcionario_escuela_escuela_id` ON `funcionario_escuela` (`escuela_id`);--> statement-breakpoint
CREATE INDEX `idx_funcionarios_persona_id` ON `funcionarios` (`persona_id`);