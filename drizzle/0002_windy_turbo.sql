CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text DEFAULT '[Missing username]' NOT NULL,
	`sub` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_sub_unique` ON `users` (`sub`);--> statement-breakpoint
ALTER TABLE `qa_history` ADD `user_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `qa_history` DROP COLUMN `username`;--> statement-breakpoint
ALTER TABLE `qa_history` DROP COLUMN `sub`;