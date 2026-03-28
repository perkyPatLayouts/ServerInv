# ServerInv API Reference

Base URL: `/api`

All endpoints except `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/verify-reset-token`, and `/api/auth/reset-password` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Endpoints that create, update, or delete data require the **admin** or **editor** role (except user management and backups, which require **admin** only).

---

## Authentication

### POST /api/auth/login

Authenticate and receive a JWT.

**Request body:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**Response (401):**
```json
{ "error": "Invalid credentials" }
```

**Response (429) — Rate limited (5 attempts per 15 minutes):**
```json
{ "error": "Too many login attempts. Please try again later." }
```

### POST /api/auth/forgot-password

Request a password reset email. Always returns success even if the email doesn't exist (security best practice).

**Rate limited:** 3 requests per 15 minutes per IP.

**Request body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{ "success": true, "message": "If that email exists, a reset link has been sent." }
```

**Response (429):**
```json
{ "error": "Too many password reset requests. Please try again later." }
```

### GET /api/auth/verify-reset-token

Verify if a password reset token is valid and not expired.

**Query parameters:**
- `token` — 64-character hex string

**Response (200):**
```json
{ "valid": true }
```

**Response (400):**
```json
{ "error": "Invalid or expired token" }
```

### POST /api/auth/reset-password

Reset password using a valid token.

**Request body:**
```json
{
  "token": "64-character-hex-string",
  "newPassword": "newpassword"
}
```

**Response (200):**
```json
{ "success": true, "message": "Password has been reset successfully." }
```

**Response (400):**
```json
{ "error": "Invalid or expired token" }
```

---

## Servers

### GET /api/servers

List all servers with joined fields (provider name, location, CPU, OS, websites, etc.).

**Response (200):** Array of Server objects with joined fields.

### POST /api/servers (admin/editor)

Create a new server.

**Request body:**
```json
{
  "name": "web-prod-01",
  "url": "https://example.com",
  "ip": "192.168.1.1",
  "serverTypeId": 1,
  "providerId": 1,
  "locationId": 1,
  "priceMonthly": "9.99",
  "priceYearly": "99.99",
  "currencyId": 1,
  "renewalDate": "2026-06-15",
  "ram": 4096,
  "diskSize": 80,
  "diskType": "SSD",
  "cpuTypeId": 1,
  "osId": 1,
  "notes": "Production web server"
}
```

All fields except `name` are optional (nullable).

### PUT /api/servers/:id (admin/editor)

Update an existing server. Same body as POST.

### DELETE /api/servers/:id (admin/editor)

Delete a server and all its associated websites (cascade).

---

## Applications

Global applications with many-to-many relationships to servers.

### GET /api/apps

List all applications.

**Response (200):**
```json
[
  { "id": 1, "name": "WordPress Blog", "notes": "Main company blog application" }
]
```

### POST /api/apps (admin/editor)

**Request body:**
```json
{
  "name": "WordPress Blog",
  "notes": "Main company blog application"
}
```

`notes` is optional. `name` must be unique.

### PUT /api/apps/:id (admin/editor)

Update an application. Same body as POST.

### DELETE /api/apps/:id (admin/editor)

Delete an application and all its server associations (via server_apps junction table).

---

## Server Applications (Junction)

Manage many-to-many relationships between servers and applications.

### GET /api/servers/:serverId/apps

List all applications associated with a server, including optional URLs.

**Response (200):**
```json
[
  {
    "id": 1,
    "serverId": 5,
    "appId": 2,
    "appName": "WordPress Blog",
    "url": "https://blog.example.com"
  }
]
```

### POST /api/servers/:serverId/apps (admin/editor)

Associate an application with a server.

**Request body:**
```json
{
  "appId": 2,
  "url": "https://blog.example.com"
}
```

`url` is optional.

### PUT /api/servers/:serverId/apps/:id (admin/editor)

Update the URL for a server-app association.

**Request body:**
```json
{
  "url": "https://new-blog.example.com"
}
```

### DELETE /api/servers/:serverId/apps/:id (admin/editor)

Remove an application association from a server (does not delete the application itself).

---

## Websites (Legacy)

Legacy one-to-many websites nested under servers. New deployments should use Applications instead.

### GET /api/servers/:serverId/websites

List all websites for a server.

### POST /api/servers/:serverId/websites (admin/editor)

**Request body:**
```json
{
  "domain": "example.com",
  "application": "WordPress",
  "notes": "Main company site"
}
```

`application` and `notes` are optional.

### PUT /api/servers/:serverId/websites/:id (admin/editor)

Update a website. Same body as POST.

### DELETE /api/servers/:serverId/websites/:id (admin/editor)

Delete a website.

---

## Currencies

### GET /api/currencies

List all currencies.

**Response (200):**
```json
[
  { "id": 1, "code": "USD", "name": "US Dollar", "symbol": "$" }
]
```

### POST /api/currencies (admin/editor)

```json
{ "code": "USD", "name": "US Dollar", "symbol": "$" }
```

### PUT /api/currencies/:id (admin/editor)

### DELETE /api/currencies/:id (admin/editor)

---

## Providers

### GET /api/providers

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "DigitalOcean",
    "siteUrl": "https://digitalocean.com",
    "controlPanelUrl": "https://cloud.digitalocean.com"
  }
]
```

### POST /api/providers (admin/editor)

```json
{
  "name": "DigitalOcean",
  "siteUrl": "https://digitalocean.com",
  "controlPanelUrl": "https://cloud.digitalocean.com"
}
```

`siteUrl` and `controlPanelUrl` are optional.

### PUT /api/providers/:id (admin/editor)

### DELETE /api/providers/:id (admin/editor)

---

## Locations

### GET /api/locations

**Response (200):**
```json
[
  { "id": 1, "city": "Amsterdam", "country": "Netherlands", "datacenter": "AMS1" }
]
```

### POST /api/locations (admin/editor)

```json
{ "city": "Amsterdam", "country": "Netherlands", "datacenter": "AMS1" }
```

`datacenter` is optional.

### PUT /api/locations/:id (admin/editor)

### DELETE /api/locations/:id (admin/editor)

---

## CPU Types

### GET /api/cpu-types

**Response (200):**
```json
[
  { "id": 1, "type": "Intel Xeon E-2388G", "cores": 8, "speed": "3.20" }
]
```

### POST /api/cpu-types (admin/editor)

```json
{ "type": "Intel Xeon E-2388G", "cores": 8, "speed": "3.20" }
```

### PUT /api/cpu-types/:id (admin/editor)

### DELETE /api/cpu-types/:id (admin/editor)

---

## Operating Systems

### GET /api/os

**Response (200):**
```json
[
  { "id": 1, "name": "Ubuntu", "version": "24.04", "variant": "server" }
]
```

### POST /api/os (admin/editor)

```json
{ "name": "Ubuntu", "version": "24.04", "variant": "server" }
```

### PUT /api/os/:id (admin/editor)

### DELETE /api/os/:id (admin/editor)

---

## Server Types

### GET /api/server-types

**Response (200):**
```json
[
  { "id": 1, "name": "VPS" }
]
```

### POST /api/server-types (admin/editor)

```json
{ "name": "VPS" }
```

### PUT /api/server-types/:id (admin/editor)

### DELETE /api/server-types/:id (admin/editor)

---

## Users

All user endpoints require admin role.

### GET /api/users

List all users (password field excluded).

### POST /api/users

```json
{ "username": "viewer1", "password": "securepass", "role": "viewer" }
```

### PUT /api/users/:id

```json
{ "username": "viewer1", "password": "newpass", "role": "admin" }
```

`password` is optional on update (omit to keep current).

### DELETE /api/users/:id

---

## Backup

All backup endpoints require admin role.

### GET /api/backup/download

Download a full database backup as a `.sql` file. The response streams the file with `Content-Disposition: attachment` headers.

**Response (200):** Binary `.sql` file download.

**Response headers:**
```
Content-Type: application/sql
Content-Disposition: attachment; filename="serverinv-backup-2026-03-03T12-00-00-000Z.sql"
```

### POST /api/backup/restore

Upload a `.sql` backup file to restore the database. Uses `multipart/form-data` with a field named `backup`.

**Request:** `multipart/form-data` with field `backup` containing a `.sql` file (max 100 MB).

**Response (200):**
```json
{ "success": true }
```

**Response (400):**
```json
{ "error": "No backup file uploaded" }
```

---

## Error Responses

All errors follow a consistent format:

**401 Unauthorized:**
```json
{ "error": "Authentication required" }
```

**403 Forbidden:**
```json
{ "error": "Admin access required" }
```

**400 Validation Error:**
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Required"]
  }
}
```

**404 Not Found:**
```json
{ "error": "Not found" }
```

**500 Internal Server Error:**
```json
{ "error": "Internal server error" }
```
