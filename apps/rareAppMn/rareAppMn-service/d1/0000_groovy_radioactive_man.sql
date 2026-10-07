CREATE TABLE `admission_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`event_name` text NOT NULL,
	`start_date` text,
	`end_date` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dormitories` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`capacity` integer,
	`fee_per_month` real,
	`facilities` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `majors` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`required_subjects` text,
	`cut_off_score` real,
	`degree_type` text,
	`tuition_fee` real,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `saved_majors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`major_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`major_id`) REFERENCES `majors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_majors_user_major_idx` ON `saved_majors` (`user_id`,`major_id`);--> statement-breakpoint
CREATE TABLE `saved_schools` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`school_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_schools_user_school_idx` ON `saved_schools` (`user_id`,`school_id`);--> statement-breakpoint
CREATE TABLE `scholarships` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`coverage` text,
	`requirements` text,
	`deadline` text,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo_url` text,
	`cover_url` text,
	`location` text,
	`tuition_fee` real,
	`dorm_available` integer DEFAULT false NOT NULL,
	`scholarship_available` integer DEFAULT false NOT NULL,
	`overview` text,
	`website` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`clerk_user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`role` text DEFAULT 'student' NOT NULL,
	`scores` text,
	`preferences` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_user_id_idx` ON `users` (`clerk_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);