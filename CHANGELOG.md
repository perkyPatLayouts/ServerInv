# Changelog

All notable changes to ServerInv will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.1.0] - 2026-03-27

### Added
- **MySQL/MariaDB Support** - Full database flexibility
  - Dual schema architecture with separate `postgres/` and `mysql/` directories
  - Automatic database type detection from `DATABASE_URL` protocol
  - Database-agnostic migrations and seeding
  - Dual backup services: `pgBackupService.ts` and `mysqlBackupService.ts`
  - Pure Node.js backup/restore (no shell commands required)
  - Works on both VPS and shared hosting environments
- **Shared Hosting Deployment** - Complete support for cPanel and DirectAdmin
  - New `deploy/setup-shared.sh` automated deployment script
  - Control panel auto-detection (cPanel or DirectAdmin)
  - Pure Node.js backup system for shared hosting
  - No root access required
  - Budget-friendly deployment option ($3-10/month)
- **LiteSpeed Optimization** - Enhanced performance for LiteSpeed web servers
  - Auto-detection of LiteSpeed vs Apache
  - Optimized `.htaccess` configuration with LiteSpeed-specific caching
  - Static asset caching (1 year) with immutable headers
  - SPA routing with cache prevention for index.html
  - API proxy with no-cache headers
  - Fallback configuration for standard Apache
- **Applications Filter** - Added filter for Applications on Inventory page
- **Web Server Choice** - VPS deployment script supports both Nginx and Apache
  - Interactive prompts for web server selection
  - Detects existing installations and warns about conflicts
  - Works alongside other sites without breaking existing configurations
  - Apache configuration template included
- **Database Utilities** - New `server/src/db/utils.ts` for database detection

### Changed
- **Deployment Scripts** - Major enhancements
  - VPS script (`deploy/setup.sh`) now includes database selection (PostgreSQL or MySQL)
  - Interactive domain name configuration
  - Web server configuration preserves existing sites
  - Improved error handling and validation
- **Documentation** - Comprehensive updates
  - All docs updated to reflect MySQL/MariaDB support
  - New shared hosting deployment guide
  - Updated developer guide with dual schema architecture
  - Enhanced deployment guide with database options
  - Updated security documentation
  - Improved README files with database selection info
- **Environment Configuration** - Enhanced `.env.example` files
  - Clear documentation of database options
  - Deployment type configuration (VPS or shared)
  - Control panel configuration options
  - Temporary directory configuration
- **Docker Compose** - Added MySQL and MariaDB options
  - PostgreSQL remains default
  - Commented MySQL and MariaDB service definitions
  - Easy switching between database types for local development
- **Schema Organization** - Restructured database schemas
  - Separate directories: `server/src/db/schema/postgres/` and `server/src/db/schema/mysql/`
  - Auto-detection and export from `schema/index.ts`
  - Separate migration directories: `server/drizzle/postgres/` and `server/drizzle/mysql/`
- **Migration System** - Database-aware migrations
  - `db:migrate` automatically detects and applies correct migrations
  - `db:generate` creates migrations for detected database type
  - No manual dialect selection required
- **Backup System** - Database-agnostic implementation
  - Automatic service selection based on database type
  - Pure Node.js implementation for shared hosting compatibility
  - Optional native tools (pg_dump/mysqldump) for VPS
  - 5-10x faster backups on VPS, fully functional on shared hosting

### Technical
- Added `mysql2` package dependency
- Added MySQL type definitions (`@types/mysql`)
- Enhanced Drizzle config with multi-driver support
- Improved seeding with database-specific conflict handling
- Updated systemd service to wait for both PostgreSQL and MySQL

### Documentation
- New `docs/shared-hosting-guide.md` - Complete cPanel/DirectAdmin deployment guide
- Updated `server/README.md` - Comprehensive with MySQL support
- Simplified `server/DEPLOYMENT.md` - Now points to main docs
- Updated all guides with database selection instructions
- Enhanced CLAUDE.md with dual deployment scenarios
- Updated SECURITY.md with database options

## [1.0.0] - 2026-03-26

### Added
- **Applications System** - Many-to-many relationship between servers and applications
  - Global applications table with name and notes (up to 32,000 chars)
  - `server_apps` junction table with optional URL per server-app pairing
  - Applications page for managing global apps
  - Server inventory cards now display associated applications with URLs
- **Editor Role** - Three-tier permission system
  - Admin: Full access (CRUD + user management + backups)
  - Editor: Data editing (CRUD on all entities) without user/backup access
  - Viewer: Read-only access
- **Billing & Payment Tracking**
  - Billing periods (Hourly, Monthly, Quarterly, Yearly, 2 Yearly, 3 Yearly)
  - Payment methods (PayPal, Credit Card, Cash, Digital Currency)
  - Recurring and auto-renew flags per server
  - Flexible price + period + currency model
- **Complete Documentation Suite**
  - User guide with role explanations and UI walkthrough
  - Deployment guide with automated setup script
  - Developer guide with architecture patterns
  - API reference with all endpoints documented
  - Database schema with ERD and table definitions
  - Security documentation with audit checklist
- **Deployment Automation**
  - `deploy/setup.sh` - One-command deployment to Ubuntu/Debian
  - Domain name configuration with automatic HTTPS via certbot
  - systemd service for auto-start and crash recovery
  - nginx reverse proxy configuration
  - `deploy/update.sh` - One-command updates with zero downtime

### Changed
- Server websites moved to legacy status (still functional)
- Updated all documentation to reflect three-tier role system
- API endpoints now support admin/editor for data mutations (except user/backup endpoints)

### Security
- CORS now restricted to `ALLOWED_ORIGINS` environment variable (no more allow-all)
- JWT_SECRET is required (no fallback default)
- Strong password requirements documented
- Command injection protection in backup operations
- Comprehensive security audit completed and documented

## [0.1.0] - 2025-03-01

### Added
- Initial release with basic server inventory
- Server types, providers, locations, currencies, CPUs, OS
- Server websites (one-to-many relationship)
- User management with admin/viewer roles
- Backup and restore functionality
- Dark and light theme support
- Card and table view toggles

---

[1.1.0]: https://github.com/yourusername/serverinv/releases/tag/v1.1.0
[1.0.0]: https://github.com/yourusername/serverinv/releases/tag/v1.0.0
[0.1.0]: https://github.com/yourusername/serverinv/releases/tag/v0.1.0
