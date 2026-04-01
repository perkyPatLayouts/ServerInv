-- Add must_change_password column to users table
ALTER TABLE `users` ADD `must_change_password` boolean DEFAULT false NOT NULL;
