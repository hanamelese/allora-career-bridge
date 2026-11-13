CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`public_key` text NOT NULL,
	`secret_key_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_public_key_idx` ON `api_keys` (`public_key`);--> statement-breakpoint
CREATE TABLE `form_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`default_config` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_form_id` text NOT NULL,
	`version` integer NOT NULL,
	`config` text NOT NULL,
	`published_at` text NOT NULL,
	FOREIGN KEY (`partner_form_id`) REFERENCES `partner_forms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `form_versions_form_version_idx` ON `form_versions` (`partner_form_id`,`version`);--> statement-breakpoint
CREATE TABLE `partner_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`type` text NOT NULL,
	`draft_config` text NOT NULL,
	`current_version` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` text,
	`published_at` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partner_forms_partner_type_idx` ON `partner_forms` (`partner_id`,`type`);--> statement-breakpoint
CREATE TABLE `partner_users` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'editor' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partner_users_email_idx` ON `partner_users` (`email`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL
);
