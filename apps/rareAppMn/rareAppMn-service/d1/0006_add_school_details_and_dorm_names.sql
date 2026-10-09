ALTER TABLE `dormitories` ADD `name` text;--> statement-breakpoint
ALTER TABLE `dormitories` ADD `fee_per_year` real;--> statement-breakpoint
ALTER TABLE `dormitories` ADD `currency` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `tuition_text` text;--> statement-breakpoint
ALTER TABLE `schools` ADD `has_dormitory` integer;--> statement-breakpoint
ALTER TABLE `schools` ADD `has_scholarships` integer;--> statement-breakpoint
ALTER TABLE `schools` ADD `dorm_guide` text;