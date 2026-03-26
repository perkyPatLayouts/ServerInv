# Changelog

All notable changes to ServerInv will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Applications Filter** - Added filter for Applications on Inventory page (many-to-many relationship)
- **Web Server Choice** - Deployment script now supports both Nginx and Apache
  - Interactive prompts ask which web server to use
  - Detects existing installations and warns about conflicts
  - Works alongside other sites without breaking existing configurations
  - Includes Apache configuration template

### Changed
- Deployment script asks for domain name interactively
- Web server configuration preserves existing sites on the server
- Improved deployment documentation with Nginx and Apache instructions

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

[1.0.0]: https://github.com/yourusername/serverinv/releases/tag/v1.0.0
[0.1.0]: https://github.com/yourusername/serverinv/releases/tag/v0.1.0
