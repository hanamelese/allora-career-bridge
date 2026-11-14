CREATE TABLE `allowed_origins` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`origin` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_origins_partner_origin` ON `allowed_origins` (`partner_id`,`origin`);