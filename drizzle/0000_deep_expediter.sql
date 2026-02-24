CREATE TABLE `qa_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
