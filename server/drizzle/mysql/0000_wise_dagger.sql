CREATE TABLE `apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`notes` text,
	CONSTRAINT `apps_id` PRIMARY KEY(`id`),
	CONSTRAINT `apps_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `backup_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`host` varchar(500) NOT NULL,
	`port` int NOT NULL DEFAULT 22,
	`username` varchar(200) NOT NULL,
	`password` varchar(500),
	`private_key` text,
	`remote_path` varchar(500) NOT NULL,
	CONSTRAINT `backup_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `billing_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `billing_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `billing_periods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `cpu_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(200) NOT NULL,
	`cores` int NOT NULL,
	`speed` decimal(5,2) NOT NULL,
	CONSTRAINT `cpu_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(10) NOT NULL,
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`datacenter` varchar(200),
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operating_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`version` varchar(50) NOT NULL,
	`variant` varchar(50) NOT NULL DEFAULT 'server',
	CONSTRAINT `operating_systems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_methods_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`site_url` varchar(500),
	`control_panel_url` varchar(500),
	CONSTRAINT `providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_apps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`server_id` int NOT NULL,
	`app_id` int NOT NULL,
	`url` varchar(500),
	CONSTRAINT `server_apps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`url` varchar(500),
	`ip` varchar(45),
	`server_type_id` int,
	`provider_id` int,
	`location_id` int,
	`price` decimal(10,2),
	`billing_period_id` int,
	`payment_method_id` int,
	`recurring` boolean NOT NULL DEFAULT false,
	`auto_renew` boolean NOT NULL DEFAULT false,
	`currency_id` int,
	`renewal_date` date,
	`ram` int,
	`disk_size` int,
	`disk_type` varchar(10),
	`cpu_type_id` int,
	`os_id` int,
	`notes` text,
	CONSTRAINT `servers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`virtualization_type` varchar(100),
	CONSTRAINT `server_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `server_types_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `server_websites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`server_id` int NOT NULL,
	`domain` varchar(500) NOT NULL,
	`application` varchar(200),
	`notes` varchar(1000),
	CONSTRAINT `server_websites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(20) NOT NULL DEFAULT 'viewer',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `server_apps` ADD CONSTRAINT `server_apps_server_id_servers_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_apps` ADD CONSTRAINT `server_apps_app_id_apps_id_fk` FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_server_type_id_server_types_id_fk` FOREIGN KEY (`server_type_id`) REFERENCES `server_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_provider_id_providers_id_fk` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_billing_period_id_billing_periods_id_fk` FOREIGN KEY (`billing_period_id`) REFERENCES `billing_periods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_payment_method_id_payment_methods_id_fk` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_currency_id_currencies_id_fk` FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_cpu_type_id_cpu_types_id_fk` FOREIGN KEY (`cpu_type_id`) REFERENCES `cpu_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_os_id_operating_systems_id_fk` FOREIGN KEY (`os_id`) REFERENCES `operating_systems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `server_websites` ADD CONSTRAINT `server_websites_server_id_servers_id_fk` FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade ON UPDATE no action;