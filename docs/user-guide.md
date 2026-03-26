# ServerInv User Guide

## Overview

ServerInv lets you track your hosting infrastructure in one place: servers, providers, costs, renewal dates, websites, and hardware specs. It features dark and light themes with card-based layouts.

## Logging In

Navigate to the application URL. You will see a login screen. Enter your username and password.

- **Default credentials**: `admin` / `admin`
- Change your password immediately after first login via the Users page.

## Roles

| Role | Permissions |
|------|-------------|
| **Administrator** | Full CRUD on all data, user management, backup/restore |
| **Editor** | Data editing (servers, apps, and all entities) but no user management or backup access |
| **Viewer** | Read-only access to all pages |

## Navigation

The sidebar contains all navigation items:

| Menu Item | Description |
|-----------|-------------|
| Inventory | Main server list with filters |
| Renewals | Servers sorted by upcoming renewal date |
| Currencies | Manage currency codes (USD, EUR, GBP, etc.) |
| CPUs | Manage CPU type definitions |
| Applications | Manage global applications (many-to-many with servers) |
| Websites | Legacy one-to-many websites per server |
| Providers | Hosting provider companies |
| Locations | Server locations (city, country) |
| Datacenters | Datacenter facilities |
| Server Types | VPS, Dedicated, Shared, etc. |
| Billing Periods | Hourly, Monthly, Quarterly, Yearly, etc. |
| Payment Methods | PayPal, Credit Card, Cash, etc. |
| OS & Versions | Operating system definitions |
| Server URLs | Quick view of all server URLs |
| Server IPs | Quick view of all server IP addresses |
| **Admin section** | |
| Users | User account management (admin only) |
| Backup | Database backup and restore (admin only) |

## Theme

Use the sun/moon icon in the top-right header to toggle between **dark** and **light** themes. Your preference is automatically saved to browser local storage and persists across sessions.

- **Dark theme**: Deep navy background with purple accents — ideal for low-light environments
- **Light theme**: Clean white surfaces with refined purple accents — ideal for daytime use

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
- Price with billing period and currency
- Renewal date (highlighted in red if due within 14 days)
- OS, CPU, RAM, disk specs
- Applications (many-to-many, each with optional URL linked to open in a new tab)
- Websites (legacy one-to-many relationship)
- **Notes** (collapsible) — if notes exist, a "Notes" toggle appears at the bottom of the card. Click the arrow to expand/collapse the notes content.

### Filtering

A filter bar sits below the page header with multi-select dropdowns for:
- **Server Type** - VPS, Dedicated, Shared, etc.
- **Provider** - Filter by hosting provider
- **Location** - Filter by city/country
- **Datacenter** - Filter by datacenter facility
- **Currency** - Filter by pricing currency
- **CPU** - Filter by CPU type
- **OS** - Filter by operating system
- **Applications** - Filter by applications hosted on servers (many-to-many)

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

## Applications Page

Manage global applications with many-to-many relationships to servers.

- Each application has a unique name and notes field
- Applications can be associated with multiple servers
- Each server-app pairing can have an optional URL
- **Add Application** (admin/editor) — Create a new application
- **Edit** (admin/editor) — Modify application name or notes
- **Delete** (admin/editor) — Remove application and all server associations
- **View servers** — See which servers use this application

## Websites Page (Legacy)

Lists all legacy websites using the one-to-many relationship.

- Each website belongs to a single server
- Shows domain, application name, server, IP, and provider
- **Add Website** (admin/editor) — Create with server selector
- **Edit** / **Delete** (admin/editor)
- Domains are clickable, opening in a new tab

**Note:** New deployments should use Applications instead for better flexibility.

---

## Server URLs / Server IPs Pages

Quick-reference views showing all servers with their URLs or IP addresses, along with provider and type information.

---

## Users Page (Admin Only)

Manage user accounts:
- **Add User** — Set username, password, and role (Administrator, Editor, or Viewer)
- **Edit** — Change username, role, or set a new password
- **Delete** — Remove a user account

**Roles:**
- **Administrator**: Full system access (CRUD + user management + backups)
- **Editor**: Data editing powers (CRUD on all entities) but no user/backup access
- **Viewer**: Read-only access to all data

---

## Backup Page (Admin Only)

### Downloading a Backup

Click **Download Backup** to generate a full database dump and download it as a `.sql` file directly to your browser. Save this file in a secure location for safekeeping.

### Restoring a Backup

1. Click **Upload & Restore** and select a previously downloaded `.sql` backup file from your computer.
2. A warning dialog will appear explaining that the existing database will be completely replaced.
3. Click **Yes, Restore** to proceed, or **Cancel** to abort.
4. After a successful restore, refresh the page to see the restored data.
