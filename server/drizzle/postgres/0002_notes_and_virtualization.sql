ALTER TABLE "servers" ALTER COLUMN "notes" TYPE varchar(32000);--> statement-breakpoint
ALTER TABLE "server_types" ADD COLUMN IF NOT EXISTS "virtualization_type" varchar(100);
