PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`referral_partner_id` text NOT NULL,
	`partner_form_id` text NOT NULL,
	`learner_name` text,
	`learner_phone` text,
	`language` text DEFAULT 'en' NOT NULL,
	`token_hash` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_test` integer DEFAULT false NOT NULL,
	`provider_message_id` text,
	`error_code` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`accepted_at` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referral_partner_id`) REFERENCES `referral_partners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`partner_form_id`) REFERENCES `partner_forms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_referrals`("id", "partner_id", "referral_partner_id", "partner_form_id", "learner_name", "learner_phone", "language", "token_hash", "status", "is_test", "provider_message_id", "error_code", "created_at", "expires_at", "accepted_at") SELECT "id", "partner_id", "referral_partner_id", "partner_form_id", "learner_name", "learner_phone", "language", "token_hash", "status", "is_test", "provider_message_id", "error_code", "created_at", "expires_at", "accepted_at" FROM `referrals`;--> statement-breakpoint
DROP TABLE `referrals`;--> statement-breakpoint
ALTER TABLE `__new_referrals` RENAME TO `referrals`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_token_hash_idx` ON `referrals` (`token_hash`);--> statement-breakpoint
ALTER TABLE `partners` ADD `delivery_url` text;--> statement-breakpoint
ALTER TABLE `partners` ADD `delivery_secret` text;