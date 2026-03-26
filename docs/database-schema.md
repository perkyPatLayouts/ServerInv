# ServerInv Database Schema

PostgreSQL 16. All tables use auto-incrementing `serial` primary keys.

## Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ server_types │     │  providers   │     │  locations   │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ name         │     │ name         │     │ city         │
│ virtualizat- │     │ site_url     │     │ country      │
│  ion_type    │     │ control_     │     │ datacenter   │
└──────┬───────┘     │  panel_url   │     └──────┬───────┘
       │             └──────┬───────┘            │
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                        servers                          │
│─────────────────────────────────────────────────────────│
│ id (PK)                                                 │
│ name                                                    │
│ url, ip                                                 │
│ server_type_id (FK) ─────────────────────► server_types │
│ provider_id (FK) ────────────────────────► providers    │
│ location_id (FK) ────────────────────────► locations    │
│ price                                                   │
│ billing_period_id (FK) ──────────────────► billing_     │
│ payment_method_id (FK) ──────────────────►  periods     │
│ currency_id (FK) ────────────────────────► payment_     │
│ recurring, auto_renew                       methods     │
│ renewal_date                              currencies    │
│ ram, disk_size, disk_type                               │
│ cpu_type_id (FK) ────────────────────────► cpu_types    │
│ os_id (FK) ──────────────────────────────► operating_   │
│ notes                                        systems    │
└────────┬──────────────┬──────────────────────────────────┘
         │ CASCADE      │ CASCADE
         │ DELETE       │ DELETE
         ▼              ▼
┌────────────────┐   ┌─────────────────────┐
│ server_apps    │   │  server_websites    │ (LEGACY)
│────────────────│   │─────────────────────│
│ id (PK)        │   │ id (PK)             │
│ server_id (FK) │   │ server_id (FK)      │
│ app_id (FK) ───┼───┼─► domain            │
│ url            │   │ application         │
└────────┬───────┘   │ notes               │
         │           └─────────────────────┘
         │
         ▼
┌────────────────┐
│     apps       │
│────────────────│
│ id (PK)        │
│ name (UNIQUE)  │
│ notes          │
└────────────────┘

┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ currencies   │  │   cpu_types      │  │operating_systems │
│──────────────│  │──────────────────│  │──────────────────│
│ id (PK)      │  │ id (PK)          │  │ id (PK)          │
│ code (UNIQUE)│  │ type             │  │ name             │
│ name         │  │ cores            │  │ version          │
│ symbol       │  │ speed            │  │ variant          │
└──────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ billing_periods  │  │ payment_methods  │
│──────────────────│  │──────────────────│
│ id (PK)          │  │ id (PK)          │
│ name (UNIQUE)    │  │ name (UNIQUE)    │
└──────────────────┘  └──────────────────┘

┌──────────────┐  ┌──────────────────┐
│    users     │  │  backup_config   │
│──────────────│  │──────────────────│
│ id (PK)      │  │ id (PK)          │
│ username     │  │ host             │
│  (UNIQUE)    │  │ port             │
│ password     │  │ username         │
│ role         │  │ password         │
│ created_at   │  │ private_key      │
│ updated_at   │  │ remote_path      │
└──────────────┘  └──────────────────┘
```

## Table Definitions

### servers

The core entity. All foreign key columns are nullable.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | Auto-increment ID |
| name | varchar(200) | NOT NULL | Server name/hostname |
| url | varchar(500) | | Server URL |
| ip | varchar(45) | | IPv4 or IPv6 address |
| server_type_id | integer | FK → server_types | VPS, Dedicated, etc. |
| provider_id | integer | FK → providers | Hosting provider |
| location_id | integer | FK → locations | Physical location |
| price | decimal(10,2) | | Cost amount |
| billing_period_id | integer | FK → billing_periods | Billing cycle |
| payment_method_id | integer | FK → payment_methods | Payment method |
| currency_id | integer | FK → currencies | Pricing currency |
| recurring | boolean | NOT NULL, DEFAULT false | Whether cost recurs |
| auto_renew | boolean | NOT NULL, DEFAULT false | Whether server auto-renews |
| renewal_date | date | | Next renewal date |
| ram | integer | | RAM in MB |
| disk_size | integer | | Disk size in GB |
| disk_type | varchar(50) | | SSD, HDD, NVMe, or custom |
| cpu_type_id | integer | FK → cpu_types | CPU specification |
| os_id | integer | FK → operating_systems | Operating system |
| notes | varchar(32000) | | Free-text notes |

### apps

Global applications that can be associated with multiple servers via many-to-many relationship.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| name | varchar(200) | NOT NULL, UNIQUE | Application name |
| notes | varchar(32000) | | Free-text notes |

### server_apps

Many-to-many junction table connecting servers to applications. Each pairing can have an optional URL.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| server_id | integer | FK → servers, NOT NULL, CASCADE | Parent server |
| app_id | integer | FK → apps, NOT NULL, CASCADE | Application |
| url | varchar(500) | | Optional URL for this app on this server |

### server_websites (LEGACY)

Legacy one-to-many relationship for websites hosted on a server. Cascade-deleted when parent server is removed.

**Note:** New deployments should use the `apps` and `server_apps` tables instead for better flexibility.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| server_id | integer | FK → servers, NOT NULL, CASCADE | Parent server |
| domain | varchar(500) | NOT NULL | Domain name |
| application | varchar(200) | | Application name (WordPress, etc.) |
| notes | varchar(1000) | | Notes |

### providers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| name | varchar(200) | NOT NULL | Provider company name |
| site_url | varchar(500) | | Provider website URL |
| control_panel_url | varchar(500) | | Control panel login URL |

### locations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| city | varchar(100) | NOT NULL | City name |
| country | varchar(100) | NOT NULL | Country name |
| datacenter | varchar(200) | | Datacenter facility name |

### currencies

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| code | varchar(10) | NOT NULL, UNIQUE | ISO code (USD, EUR, GBP) |
| name | varchar(100) | NOT NULL | Full name |
| symbol | varchar(10) | NOT NULL | Display symbol ($, etc.) |

### cpu_types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| type | varchar(200) | NOT NULL | CPU model name |
| cores | integer | NOT NULL | Number of cores |
| speed | decimal(5,2) | NOT NULL | Clock speed in GHz |

### operating_systems

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| name | varchar(100) | NOT NULL | OS name (Ubuntu, Debian, etc.) |
| version | varchar(50) | NOT NULL | Version number |
| variant | varchar(50) | NOT NULL, DEFAULT 'server' | server or desktop |

### server_types

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| name | varchar(100) | NOT NULL, UNIQUE | VPS, Dedicated, Shared |
| virtualization_type | varchar(100) | | KVM, OpenVZ, or custom value |

### billing_periods

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| name | varchar(100) | NOT NULL, UNIQUE | Hourly, Monthly, Quarterly, Yearly, etc. |

### payment_methods

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| name | varchar(100) | NOT NULL, UNIQUE | PayPal, Credit Card, Cash, etc. |

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| username | varchar(100) | NOT NULL, UNIQUE | Login username |
| password | varchar(255) | NOT NULL | bcrypt hash |
| role | varchar(20) | NOT NULL, DEFAULT 'viewer' | admin, editor, or viewer |
| created_at | timestamp | NOT NULL, DEFAULT now() | |
| updated_at | timestamp | NOT NULL, DEFAULT now() | |

**Roles:**
- `admin`: Full CRUD + user management + backup/restore
- `editor`: Data editing (servers, apps, entities) but no user/backup management
- `viewer`: Read-only access

### backup_config

Single-row table storing SFTP backup credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PK | |
| host | varchar(500) | NOT NULL | SFTP hostname |
| port | integer | NOT NULL, DEFAULT 22 | SFTP port |
| username | varchar(200) | NOT NULL | SFTP username |
| password | varchar(500) | | SFTP password |
| private_key | varchar(5000) | | SSH private key (PEM) |
| remote_path | varchar(500) | NOT NULL | Remote directory path |

## Migrations

Migrations are managed by Drizzle Kit and stored as SQL files in `server/drizzle/`.

```bash
# Generate migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate
```

## Seed Data

Running `npm run db:seed` creates:
- Admin user: `admin` / `admin` (bcrypt hashed)
- Currencies: USD, EUR, GBP
- Server types: VPS, Dedicated, Shared
- Operating systems: Ubuntu 24.04, Ubuntu 22.04, Debian 12, Debian 11, CentOS 9, AlmaLinux 9
- Billing periods: Hourly, Monthly, Quarterly, Yearly, 2 Yearly, 3 Yearly
- Payment methods: PayPal, Credit Card, Cash, Digital Currency
