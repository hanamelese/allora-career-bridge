CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`partner_form_id` text NOT NULL,
	`version` integer NOT NULL,
	`answers` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_form_id`) REFERENCES `partner_forms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `submissions_form_created` ON `submissions` (`partner_form_id`,`created_at`);