# ServerInv User Guide

## Overview

ServerInv lets you track your hosting infrastructure in one place: servers, providers, costs, renewal dates, websites, and hardware specs. It features a dark dashboard theme with card-based layouts.

## Logging In

Navigate to the application URL. You will see a login screen. Enter your username and password.

- **Default credentials**: `admin` / `admin`
- Change your password immediately after first login via the Users page.

## Roles

| Role | Permissions |
|------|-------------|
| **Administrator** | Full CRUD on all data, user management, backup/restore |
| **Viewer** | Read-only access to all pages |

## Navigation

The sidebar contains all navigation items:

| Menu Item | Description |
|-----------|-------------|
| Inventory | Main server list with filters |
| Renewals | Servers sorted by upcoming renewal date |
| Currencies | Manage currency codes (USD, EUR, GBP, etc.) |
| CPUs | Manage CPU type definitions |
| Websites & Apps | All websites/applications across all servers |
| Providers | Hosting provider companies |
| Locations | Server locations (city, country) |
| Datacenters | Datacenter facilities |
| Server Types | VPS, Dedicated, Shared, etc. |
| OS & Versions | Operating system definitions |
| Server URLs | Quick view of all server URLs |
| Server IPs | Quick view of all server IP addresses |
| **Admin section** | |
| Users | User account management (admin only) |
| Backup | Database backup and restore (admin only) |

## Theme

Use the sun/moon icon in the top-right header to toggle between dark and light themes. Your preference is saved across sessions.

## Views: Cards and Table

Every data list supports two views, toggled by the **Cards / Table** buttons in the top-right of each list:

- **Cards**: Responsive grid layout (3 columns on desktop, 1 on mobile). Default view.
- **Table**: Traditional sortable table. Click column headers to sort.

---

## Inventory Page

The main page showing all servers in your inventory.

### Server Cards

Each card displays:
- Server name and type badge
- Provider (linked to provider website, with CP badge linking to control panel)
- IP address, location, datacenter
- Monthly price with currency
- Renewal date (highlighted in red if due within 14 days)
- OS, CPU, RAM, disk specs
- Websites & Apps (each linked to open in a new browser tab)
- Sites count (click to manage websites)

### Filtering

A filter bar sits below the page header with multi-select dropdowns for:
- **Server Type** - VPS, Dedicated, Shared, etc.
- **Provider** - Filter by hosting provider
- **Location** - Filter by city/country
- **Datacenter** - Filter by datacenter facility
- **Currency** - Filter by pricing currency
- **CPU** - Filter by CPU type
- **OS** - Filter by operating system

Each dropdown shows checkboxes. Select multiple values to include servers matching any of them. A badge shows how many values are selected. Click **Clear all** to reset all filters.

Filters are reflected in the URL, so you can bookmark or share filtered views.

### Adding a Server (Admin)

1. Click **Add Server**.
2. Fill in the form. All fields except Name are optional.
3. Use **+ Add new** links next to Provider, Location, and OS dropdowns to create new entries inline.
4. Click **Create**.

### Editing / Deleting a Server (Admin)

- Click **Edit** on a card or table row to modify.
- Click **Del** / **Delete** to remove. A confirmation dialog will appear.

### Managing Websites

- Click the **N sites** link on a card to open the websites modal.
- Add, edit, or delete websites associated with that server.

---

## Renewals Page

Shows servers sorted by renewal date, earliest first. Color coding:
- **Red**: Overdue or due within 7 days
- **Amber**: Due within 30 days
- **Yellow**: Due within 90 days
- **Green**: More than 90 days away

---

## Attribute Pages

Currencies, CPUs, Providers, Locations, Datacenters, Server Types, and OS & Versions all follow the same pattern:

- List all entries in cards or table view
- **View servers** link on each entry navigates to the Inventory page filtered by that attribute
- Admin users see **Add**, **Edit**, and **Delete** controls

### Providers

Provider entries include:
- **Name** - Company name
- **Site URL** - Provider's website (displayed as a link)
- **Control Panel URL** - Direct link to the provider's control panel

In the inventory and other pages, provider names link to their website, and a **CP** badge links to the control panel.

---

## Websites & Applications Page

Lists all websites/applications across all servers.

- Each row shows domain, application name, server, IP, and provider
- Admin users can **Add Website** (with server selector), **Edit**, or **Delete**
- Domains are clickable in inventory cards, opening in a new tab

---

## Server URLs / Server IPs Pages

Quick-reference views showing all servers with their URLs or IP addresses, along with provider and type information.

---

## Users Page (Admin Only)

Manage user accounts:
- **Add User** - Set username, password, and role (Administrator or Viewer)
- **Edit** - Change username, role, or set a new password
- **Delete** - Remove a user account

---

## Backup Page (Admin Only)

### SFTP Configuration

Configure the remote SFTP server for storing backups:
- Host, port, username
- Password or private key authentication
- Remote path for backup storage

### Creating a Backup

Click **Create Backup** to generate a database dump and upload it to the configured SFTP server.

### Restoring a Backup

The **Remote Backups** section lists all backups on the SFTP server. Click **Restore** on any backup to overwrite the current database with that backup's data. A confirmation prompt appears before proceeding.
