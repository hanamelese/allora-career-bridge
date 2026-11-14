CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`partner_id` text NOT NULL,
	`referral_partner_id` text NOT NULL,
	`partner_form_id` text NOT NULL,
	`learner_name` text NOT NULL,
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
CREATE UNIQUE INDEX `referrals_token_hash_idx` ON `referrals` (`token_hash`);