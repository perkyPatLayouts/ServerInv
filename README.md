# ServerInv

A web application for managing VPS, Shared, and Bare Metal server inventory. Track server specs, providers, costs, renewals, and hosted applications.

## Features

- **Server Inventory Management** - Track servers with detailed specs (CPU, RAM, disk, OS)
- **Applications** - Many-to-many relationships between servers and applications
- **Provider Management** - Store hosting provider info with site and control panel URLs
- **Renewal Tracking** - Monitor upcoming renewal dates with color-coded alerts
- **Cost Tracking** - Multi-currency support with flexible billing periods
- **Role-Based Access** - Three-tier permission system (Admin, Editor, Viewer)
- **Backup & Restore** - Database backup/restore directly from the browser
- **Dark/Light Theme** - Persistent theme preference with clean UI
- **Responsive Design** - Card and table views for all data

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16+ or MySQL 8+/MariaDB 10+ + Drizzle ORM
- **Auth**: JWT with bcrypt password hashing
- **Security**: Helmet.js, CORS, input validation (Zod)

## Quick Start

See the [docs/README.md](docs/README.md) for local development setup.

```bash
# Start PostgreSQL
docker compose up -d

# Setup environment
cp .env.example .env
cp .env server/.env

# Install and run
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:5173 and login with `admin` / `admin`.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/README.md](docs/README.md) | Documentation index and quick start |
| [docs/user-guide.md](docs/user-guide.md) | User interface and features guide |
| [docs/deployment-guide.md](docs/deployment-guide.md) | VPS/Dedicated server deployment |
| [docs/shared-hosting-guide.md](docs/shared-hosting-guide.md) | Shared hosting (cPanel/DirectAdmin) deployment |
| [docs/update-guide.md](docs/update-guide.md) | Updating existing installations |
| [docs/developer-guide.md](docs/developer-guide.md) | Architecture and development guide |
| [docs/api-reference.md](docs/api-reference.md) | REST API endpoint documentation |
| [docs/database-schema.md](docs/database-schema.md) | Database schema and relationships |
| [docs/SECURITY.md](docs/SECURITY.md) | Security measures and best practices |

## Deployment

ServerInv supports two deployment options:

### VPS/Dedicated Server (Recommended)

Deploy to a fresh Ubuntu 24.04 or Debian 12 VPS with the automated script:

```bash
sudo bash deploy/setup.sh
```

The interactive installer will:
- Ask for your domain name
- Detect existing web servers (Nginx/Apache)
- Let you choose which web server to use
- Install Node.js, PostgreSQL, and chosen web server
- Create database with secure credentials
- Build and deploy the application
- Set up systemd service for auto-start
- Configure web server as reverse proxy
- Obtain SSL certificate via Let's Encrypt

**Features:**
- ✅ Supports both **Nginx** (recommended) and **Apache**
- ✅ Detects existing installations and warns about conflicts
- ✅ Works alongside other sites (won't break existing configurations)
- ✅ Fast native PostgreSQL backups via pg_dump
- ✅ Full root access for customization

See [docs/deployment-guide.md](docs/deployment-guide.md) for full details.

### Shared Hosting (cPanel/DirectAdmin)

Deploy to shared hosting with cPanel or DirectAdmin (supports Apache, LiteSpeed, and compatible web servers):

```bash
bash deploy/setup-shared.sh
```

The script will:
- Detect your control panel (cPanel or DirectAdmin)
- Auto-detect web server (Apache/LiteSpeed)
- Prompt for domain and database credentials
- Install dependencies and build the application
- Set up the database
- Register with control panel Node.js manager
- Provide optimized configuration for your web server
- Provide step-by-step instructions for domain/SSL setup

**Features:**
- ✅ Works without root access
- ✅ Pure Node.js backup/restore (no pg_dump required)
- ✅ Budget-friendly option (~$3-10/month)
- ✅ Automatic control panel integration
- ✅ LiteSpeed optimized caching (if available)
- ⚠️ Slower backups (~5-10x vs VPS)
- ⚠️ Best for small-medium databases (<500MB)

See [docs/shared-hosting-guide.md](docs/shared-hosting-guide.md) for full details.

## License

Private project - All rights reserved.
