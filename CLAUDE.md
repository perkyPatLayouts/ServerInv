# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ServerInv is a web application for maintaining an inventory of VPS, Shared, and Bare Metal hosting servers. It tracks server specs, providers, costs, renewals, and hosted websites/applications.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js (Express or similar)
- **Database**: PostgreSQL
- **Deployment target**: Ubuntu Server 24.04 or Debian

## Code Style

- 2-space indentation for TypeScript/JavaScript/CSS
- JSDoc comments on all methods, types, and interfaces

## Architecture

### Data Model

The core entity is a **Server** with these related entities (each with full CRUD):
- **Locations** (where servers are hosted)
- **Providers** (hosting companies, with control panel URL and site URL)
- **Currencies** (USD, EUR, GBP)
- **CPU Types** (type, cores, speed)
- **Operating Systems** (Debian/Ubuntu, version, server/desktop)
- **Server Types** (VPS, Dedicated, Shared — with optional virtualization type: KVM, OpenVZ, or custom)
- **Billing Periods** (Hourly, Monthly, Quarterly, Yearly, 2 Yearly, 3 Yearly)
- **Payment Methods** (PayPal, Credit Card, Cash, Digital Currency)
- **Applications** (decoupled apps with many-to-many relationship to servers)

**Server fields**: URL, IP, server type, provider, price (single amount + billing period + currency + payment method + recurring flag + auto-renew flag + renewal date), location, RAM, disk (SSD/HDD/NVMe or custom via "Add New" + size), CPU, OS, notes (up to 32,000 chars).

**Server relationships**:
- **Websites** (legacy): One-to-many relationship via `server_websites` table (domain, optional application, notes)
- **Applications** (new): Many-to-many relationship via `server_apps` junction table. Each server-app pairing can have an optional URL. Apps are managed globally with name and notes (up to 32,000 chars).

### Pages

Each page shows servers filtered/grouped by that dimension:
Inventory, Renewals, Currencies, CPUs, Applications, Providers, Locations, Server Types, Billing Periods, Payment Methods, OS & Versions, Server URLs, Server IPs

### Authentication & Authorization

- **Three roles**:
  - **Administrator**: Full CRUD + user management + backup/restore operations
  - **Editor**: Data editing powers (CRUD on servers, apps, and related entities) but no user management or backup access
  - **Viewer**: Read-only access to all data
- All routes require authentication — no public access
- Default initial credentials: `admin` / `admin` (MUST be changed in production)

### Backup System

- Admin-invokable backup/restore from within the app
- Backup method: SFTP of zipped database dump to offsite server

## Deployment

- Target: fresh Ubuntu or Debian VPS, non-root user with sudo
- Must include: full deployment instructions, auto-start after reboot/updates, offsite backup server setup
- **Security Requirements**:
  - Strong JWT_SECRET (generate with `openssl rand -base64 32`)
  - Unique database credentials (not defaults)
  - CORS properly configured for production domain
  - SSL/TLS enabled via certbot
  - Change default admin password immediately after first login

## Security

- JWT-based authentication with httpOnly considerations
- Role-based access control (RBAC) for admin/editor/viewer roles
- Bcrypt password hashing (10 rounds)
- Helmet.js security headers
- CORS restricted to allowed origins only
- Input validation via Zod schemas
- SQL injection protection via Drizzle ORM
- Command injection protection in backup operations
- No sensitive data exposure in error messages
