ALTER TABLE `majors` ADD `primary_subjects` text;--> statement-breakpoint
ALTER TABLE `majors` ADD `secondary_subjects` text;--> statement-breakpoint
ALTER TABLE `majors` ADD `tuition_is_estimate` integer DEFAULT false NOT NULL;