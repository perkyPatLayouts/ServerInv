CREATE TABLE "backup_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"host" varchar(500) NOT NULL,
	"port" integer DEFAULT 22 NOT NULL,
	"username" varchar(200) NOT NULL,
	"password" varchar(500),
	"private_key" varchar(5000),
	"remote_path" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cpu_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(200) NOT NULL,
	"cores" integer NOT NULL,
	"speed" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"city" varchar(100) NOT NULL,
	"country" varchar(100) NOT NULL,
	"datacenter" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "operating_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"version" varchar(50) NOT NULL,
	"variant" varchar(50) DEFAULT 'server' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"site_url" varchar(500),
	"control_panel_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"url" varchar(500),
	"ip" varchar(45),
	"server_type_id" integer,
	"provider_id" integer,
	"location_id" integer,
	"price_monthly" numeric(10, 2),
	"price_yearly" numeric(10, 2),
	"currency_id" integer,
	"renewal_date" date,
	"ram" integer,
	"disk_size" integer,
	"disk_type" varchar(10),
	"cpu_type_id" integer,
	"os_id" integer,
	"notes" varchar(2000)
);
--> statement-breakpoint
CREATE TABLE "server_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "server_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "server_websites" (
	"id" serial PRIMARY KEY NOT NULL,
	"server_id" integer NOT NULL,
	"domain" varchar(500) NOT NULL,
	"application" varchar(200),
	"notes" varchar(1000)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_server_type_id_server_types_id_fk" FOREIGN KEY ("server_type_id") REFERENCES "public"."server_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_currency_id_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."currencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_cpu_type_id_cpu_types_id_fk" FOREIGN KEY ("cpu_type_id") REFERENCES "public"."cpu_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_os_id_operating_systems_id_fk" FOREIGN KEY ("os_id") REFERENCES "public"."operating_systems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_websites" ADD CONSTRAINT "server_websites_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;