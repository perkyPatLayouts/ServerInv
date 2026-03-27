# ServerInv Deployment

ServerInv supports two deployment options:

## 🖥️ VPS/Dedicated Server Deployment

For production deployments with full control, PostgreSQL support, and fast native backups.

**📖 [Read the VPS Deployment Guide](../docs/deployment-guide.md)**

**Quick Start:**
```bash
cd /opt/serverinv
sudo bash deploy/setup.sh
```

## 🌐 Shared Hosting Deployment

For budget-friendly deployments on cPanel or DirectAdmin with Apache/LiteSpeed support.

**📖 [Read the Shared Hosting Guide](../docs/shared-hosting-guide.md)**

**Quick Start:**
```bash
cd ~/serverinv
bash deploy/setup-shared.sh
```

## Documentation Index

| Document | Description |
|----------|-------------|
| [Main README](../README.md) | Project overview and quick start |
| [Deployment Guide](../docs/deployment-guide.md) | VPS/Dedicated server deployment |
| [Shared Hosting Guide](../docs/shared-hosting-guide.md) | cPanel/DirectAdmin deployment |
| [Developer Guide](../docs/developer-guide.md) | Architecture and development |
| [Database Schema](../docs/database-schema.md) | Database structure |
| [API Reference](../docs/api-reference.md) | REST API documentation |
| [Security](../docs/SECURITY.md) | Security best practices |

## Database Support

ServerInv supports both database types with automatic detection:

- **PostgreSQL 16+** (recommended for VPS)
- **MySQL 8+ / MariaDB 10+** (common for shared hosting)

The system auto-detects the database type from your `DATABASE_URL`:
- `postgres://` → PostgreSQL
- `mysql://` → MySQL/MariaDB

## Environment Variables

Create a `.env` file in the server directory:

```bash
# Database (choose one)
DATABASE_URL=postgres://user:pass@localhost:5432/serverinv
# or
DATABASE_URL=mysql://user:pass@localhost:3306/serverinv

# Security (REQUIRED - generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

## Quick Commands

```bash
# Run migrations (auto-detects database type)
npm run db:migrate

# Seed initial data
npm run db:seed

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Support

For deployment issues, refer to the troubleshooting sections in:
- [VPS Deployment Guide](../docs/deployment-guide.md#troubleshooting)
- [Shared Hosting Guide](../docs/shared-hosting-guide.md#troubleshooting)
