CREATE INDEX `admission_schedules_school_id_idx` ON `admission_schedules` (`school_id`);--> statement-breakpoint
CREATE INDEX `dormitories_school_id_idx` ON `dormitories` (`school_id`);--> statement-breakpoint
CREATE INDEX `majors_school_id_idx` ON `majors` (`school_id`);--> statement-breakpoint
CREATE INDEX `saved_majors_major_id_idx` ON `saved_majors` (`major_id`);--> statement-breakpoint
CREATE INDEX `saved_schools_school_id_idx` ON `saved_schools` (`school_id`);--> statement-breakpoint
CREATE INDEX `scholarships_school_id_idx` ON `scholarships` (`school_id`);