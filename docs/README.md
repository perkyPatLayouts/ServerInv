# ServerInv Documentation

ServerInv is a web application for maintaining an inventory of VPS, Shared, and Bare Metal hosting servers. It tracks server specs, providers, costs, renewals, hosted websites (legacy), and applications (new many-to-many relationship).

## Documentation Index

| Document | Audience | Description |
|----------|----------|-------------|
| [User Guide](user-guide.md) | End users | How to use the application |
| [Developer Guide](developer-guide.md) | Developers | Architecture, codebase, and local development |
| [API Reference](api-reference.md) | Developers | REST API endpoints and payloads |
| [Database Schema](database-schema.md) | Developers | Tables, columns, and relationships |
| [Deployment Guide](deployment-guide.md) | DevOps / Sysadmins | Deploying to a VPS/dedicated server |
| [Shared Hosting Guide](shared-hosting-guide.md) | DevOps / Sysadmins | Deploying to cPanel/DirectAdmin hosting |
| [Security](SECURITY.md) | All | Security measures and best practices |

## Quick Start (Local Development)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Copy environment file
cp .env.example .env
cp .env server/.env

# 3. Install dependencies
npm install

# 4. Run migrations and seed
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
```

Open http://localhost:5173 and log in with `admin` / `admin`.
