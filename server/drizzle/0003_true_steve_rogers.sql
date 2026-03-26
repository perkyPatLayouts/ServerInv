CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"notes" varchar(32000),
	CONSTRAINT "apps_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "server_apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"app_id" integer NOT NULL,
	"url" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "server_apps" ADD CONSTRAINT "server_apps_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_apps" ADD CONSTRAINT "server_apps_app_id_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Data migration: Extract unique applications from server_websites and create app records
INSERT INTO apps (name)
SELECT DISTINCT application
FROM server_websites
WHERE application IS NOT NULL AND application != ''
ORDER BY application;
--> statement-breakpoint

-- Data migration: Create server_apps relationships from server_websites
-- Map domain to URL field for each server-app pairing
INSERT INTO server_apps (server_id, app_id, url)
SELECT
  sw.server_id,
  a.id as app_id,
  sw.domain as url
FROM server_websites sw
INNER JOIN apps a ON sw.application = a.name
WHERE sw.application IS NOT NULL AND sw.application != '';