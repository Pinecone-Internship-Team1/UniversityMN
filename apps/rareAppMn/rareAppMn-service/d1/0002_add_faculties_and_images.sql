CREATE TABLE `faculties` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `faculties_school_name_idx` ON `faculties` (`school_id`,`name`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`content_type` text NOT NULL,
	`data` blob NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `majors` ADD `faculty_id` text REFERENCES faculties(id);--> statement-breakpoint
CREATE INDEX `majors_faculty_id_idx` ON `majors` (`faculty_id`);--> statement-breakpoint
-- Backfill: every university's existing majors go into one "Бусад хөтөлбөрүүд"
-- faculty, so each major has a faculty; admins can then move them to real ones.
INSERT INTO `faculties` (`id`, `school_id`, `name`)
SELECT
	lower(
		hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-'
		|| substr('89ab', 1 + abs(random()) % 4, 1) || substr(hex(randomblob(2)), 2) || '-'
		|| hex(randomblob(6))
	),
	`school_id`,
	'Бусад хөтөлбөрүүд'
FROM `majors`
GROUP BY `school_id`;
--> statement-breakpoint
UPDATE `majors`
SET `faculty_id` = (
	SELECT `faculties`.`id`
	FROM `faculties`
	WHERE `faculties`.`school_id` = `majors`.`school_id`
		AND `faculties`.`name` = 'Бусад хөтөлбөрүүд'
);
