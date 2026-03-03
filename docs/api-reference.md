# ServerInv API Reference

Base URL: `/api`

All endpoints except `/api/auth/login` require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Endpoints that create, update, or delete data require the **admin** role.

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

---

## Servers

### GET /api/servers

List all servers with joined fields (provider name, location, CPU, OS, websites, etc.).

**Response (200):** Array of Server objects with joined fields.

### POST /api/servers (admin)

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

### PUT /api/servers/:id (admin)

Update an existing server. Same body as POST.

### DELETE /api/servers/:id (admin)

Delete a server and all its associated websites (cascade).

---

## Websites

Websites are nested under servers.

### GET /api/servers/:serverId/websites

List all websites for a server.

### POST /api/servers/:serverId/websites (admin)

**Request body:**
```json
{
  "domain": "example.com",
  "application": "WordPress",
  "notes": "Main company site"
}
```

`application` and `notes` are optional.

### PUT /api/servers/:serverId/websites/:id (admin)

Update a website. Same body as POST.

### DELETE /api/servers/:serverId/websites/:id (admin)

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

### POST /api/currencies (admin)

```json
{ "code": "USD", "name": "US Dollar", "symbol": "$" }
```

### PUT /api/currencies/:id (admin)

### DELETE /api/currencies/:id (admin)

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

### POST /api/providers (admin)

```json
{
  "name": "DigitalOcean",
  "siteUrl": "https://digitalocean.com",
  "controlPanelUrl": "https://cloud.digitalocean.com"
}
```

`siteUrl` and `controlPanelUrl` are optional.

### PUT /api/providers/:id (admin)

### DELETE /api/providers/:id (admin)

---

## Locations

### GET /api/locations

**Response (200):**
```json
[
  { "id": 1, "city": "Amsterdam", "country": "Netherlands", "datacenter": "AMS1" }
]
```

### POST /api/locations (admin)

```json
{ "city": "Amsterdam", "country": "Netherlands", "datacenter": "AMS1" }
```

`datacenter` is optional.

### PUT /api/locations/:id (admin)

### DELETE /api/locations/:id (admin)

---

## CPU Types

### GET /api/cpu-types

**Response (200):**
```json
[
  { "id": 1, "type": "Intel Xeon E-2388G", "cores": 8, "speed": "3.20" }
]
```

### POST /api/cpu-types (admin)

```json
{ "type": "Intel Xeon E-2388G", "cores": 8, "speed": "3.20" }
```

### PUT /api/cpu-types/:id (admin)

### DELETE /api/cpu-types/:id (admin)

---

## Operating Systems

### GET /api/os

**Response (200):**
```json
[
  { "id": 1, "name": "Ubuntu", "version": "24.04", "variant": "server" }
]
```

### POST /api/os (admin)

```json
{ "name": "Ubuntu", "version": "24.04", "variant": "server" }
```

### PUT /api/os/:id (admin)

### DELETE /api/os/:id (admin)

---

## Server Types

### GET /api/server-types

**Response (200):**
```json
[
  { "id": 1, "name": "VPS" }
]
```

### POST /api/server-types (admin)

```json
{ "name": "VPS" }
```

### PUT /api/server-types/:id (admin)

### DELETE /api/server-types/:id (admin)

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

### GET /api/backup/config

Get the current SFTP backup configuration.

### POST /api/backup/config

Save SFTP configuration.

```json
{
  "host": "backup.example.com",
  "port": 22,
  "username": "backupuser",
  "password": "secret",
  "privateKey": null,
  "remotePath": "/backups/serverinv"
}
```

### GET /api/backup/list

List backup files on the remote SFTP server.

**Response (200):**
```json
[
  { "name": "serverinv_2026-03-03.sql.gz", "size": 15360, "modifyTime": 1741024800 }
]
```

### POST /api/backup/export

Create a database dump and upload to SFTP.

**Response (200):**
```json
{ "filename": "serverinv_2026-03-03.sql.gz" }
```

### POST /api/backup/restore

Download and restore a backup from SFTP.

```json
{ "filename": "serverinv_2026-03-03.sql.gz" }
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
