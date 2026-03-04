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

Server fields: URL, IP, server type, provider, price (single amount + billing period + currency + payment method + recurring flag + auto-renew flag + renewal date), location, RAM, disk (SSD/HDD/NVMe or custom via "Add New" + size), CPU, OS, notes (up to 32,000 chars), and associated websites/domains/applications.

### Pages

Each page shows servers filtered/grouped by that dimension:
Inventory, Renewals, Currencies, CPUs, Websites & Applications, Providers, Locations, Server Types, Billing Periods, Payment Methods, OS & Versions, Server URLs, Server IPs

### Authentication & Authorization

- Two roles: **Administrator** (full CRUD + user management) and **Viewer** (read-only)
- All routes require authentication — no public access
- Default initial credentials: `admin` / `admin`

### Backup System

- Admin-invokable backup/restore from within the app
- Backup method: SFTP of zipped database dump to offsite server

## Deployment

- Target: fresh Ubuntu or Debian VPS, non-root user with sudo
- Must include: full deployment instructions, auto-start after reboot/updates, offsite backup server setup
