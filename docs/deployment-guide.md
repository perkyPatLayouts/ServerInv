# ServerInv Deployment Guide

Deploy ServerInv on a fresh Ubuntu 24.04 or Debian 12 VPS.

## Prerequisites

- A VPS with Ubuntu 24.04 or Debian 12
- Root or sudo access
- A domain name pointed to the server's IP (optional, for HTTPS)
- At least 1 GB RAM, 10 GB disk

## Quick Deploy (Automated)

The `deploy/setup.sh` script handles everything automatically:

```bash
# Clone or upload the project to the server
git clone <your-repo-url> /tmp/serverinv
cd /tmp/serverinv

# Run the setup script as root
sudo bash deploy/setup.sh
```

The script will:
1. Install Node.js 20.x, PostgreSQL, and nginx
2. Create a `serverinv` system user
3. Create the PostgreSQL database with a random password
4. Copy the app to `/opt/serverinv`
5. Generate `.env` with database URL and JWT secret
6. Install dependencies and build the frontend
7. Run database migrations and seed default data
8. Configure systemd service and nginx reverse proxy

On completion it prints the app URL, database password, and JWT secret. **Save these values.**

Default login: `admin` / `admin`

---

## Manual Deployment

### 1. Install System Packages

```bash
sudo apt-get update
sudo apt-get install -y curl nginx postgresql postgresql-contrib
```

### 2. Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x
```

### 3. Create Application User

```bash
sudo useradd --system --create-home --shell /bin/bash serverinv
```

### 4. Set Up PostgreSQL

```bash
# Create database user and database
sudo -u postgres psql -c "CREATE USER serverinv WITH PASSWORD 'your-secure-password';"
sudo -u postgres createdb -O serverinv serverinv
```

### 5. Deploy Application Files

```bash
sudo mkdir -p /opt/serverinv
sudo cp -r . /opt/serverinv/
sudo chown -R serverinv:serverinv /opt/serverinv
```

### 6. Configure Environment

```bash
sudo tee /opt/serverinv/.env > /dev/null << EOF
DATABASE_URL=postgres://serverinv:your-secure-password@localhost:5432/serverinv
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
EOF

sudo cp /opt/serverinv/.env /opt/serverinv/server/.env
sudo chown serverinv:serverinv /opt/serverinv/.env /opt/serverinv/server/.env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random secret for signing JWTs (minimum 32 hex chars) |
| `PORT` | Backend listen port (default `3000`) |

### 7. Install Dependencies and Build

```bash
cd /opt/serverinv
sudo -u serverinv npm install

cd /opt/serverinv/client
sudo -u serverinv npm run build
```

### 8. Run Migrations and Seed

```bash
cd /opt/serverinv/server
sudo -u serverinv npx tsx src/db/migrate.ts
sudo -u serverinv npx tsx src/db/seed.ts
```

> **Note:** Do NOT run `drizzle-kit generate` on the server. Migrations are generated
> locally during development and committed to the repository. The server only runs
> `db:migrate` to apply them.

This creates the database tables and seeds:
- Admin user: `admin` / `admin`
- Currencies: USD, EUR, GBP
- Server types: VPS, Dedicated, Shared
- Operating systems: Ubuntu 24.04, Ubuntu 22.04, Debian 12, Debian 11, CentOS 9, AlmaLinux 9
- Billing periods: Hourly, Monthly, Quarterly, Yearly, 2 Yearly, 3 Yearly
- Payment methods: PayPal, Credit Card, Cash, Digital Currency

### 9. Configure systemd Service

Copy the unit file:

```bash
sudo cp /opt/serverinv/deploy/serverinv.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable serverinv
sudo systemctl start serverinv
```

The service file (`deploy/serverinv.service`):

```ini
[Unit]
Description=ServerInv Backend
After=network.target postgresql.service

[Service]
Type=simple
User=serverinv
WorkingDirectory=/opt/serverinv/server
ExecStart=/usr/bin/npx tsx src/index.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Key features:
- Starts after PostgreSQL is ready
- Runs as the `serverinv` user
- Restarts automatically on crash (5-second delay)
- Starts on boot via `WantedBy=multi-user.target`

Useful commands:

```bash
sudo systemctl status serverinv     # Check status
sudo systemctl restart serverinv    # Restart
sudo journalctl -u serverinv -f     # View logs
```

### 10. Configure nginx

Copy the config:

```bash
sudo cp /opt/serverinv/deploy/serverinv.nginx /etc/nginx/sites-available/serverinv
sudo ln -sf /etc/nginx/sites-available/serverinv /etc/nginx/sites-enabled/serverinv
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

The nginx config (`deploy/serverinv.nginx`):

```nginx
server {
    listen 80;
    server_name _;

    root /opt/serverinv/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

How it works:
- Serves the built React frontend from `/opt/serverinv/client/dist`
- Proxies `/api/` requests to the Node.js backend on port 3000
- Falls back to `index.html` for client-side routing

If using a domain name, replace `server_name _;` with `server_name yourdomain.com;`.

---

## HTTPS with Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will:
- Obtain a Let's Encrypt certificate
- Modify the nginx config for SSL
- Set up automatic renewal via a systemd timer

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## Firewall

If using `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

This allows SSH (22), HTTP (80), and HTTPS (443).

---

## Updating the Application

### Automated Update (Recommended)

First, pull the latest code:

```bash
cd /opt/serverinv
sudo -u serverinv git pull
```

Then run the update script:

```bash
sudo bash /opt/serverinv/deploy/update.sh
```

This script will:
1. Stop the ServerInv service
2. Pull the latest code via `git pull`
3. Install any new dependencies
4. Rebuild the frontend
5. Run database migrations
6. Restart the service and show its status

### Manual Update

```bash
# Stop the service
sudo systemctl stop serverinv

cd /opt/serverinv

# Pull latest code (or upload new files)
sudo -u serverinv git pull

# Install any new dependencies
sudo -u serverinv npm install

# Rebuild frontend
cd /opt/serverinv/client
sudo -u serverinv npm run build

# Run any new migrations (do NOT run drizzle-kit generate on server)
cd /opt/serverinv/server
sudo -u serverinv npx tsx src/db/migrate.ts

# Restart backend
sudo systemctl start serverinv
```

---

## Backup and Restore

ServerInv supports database backup and restore directly through the browser.

### Creating a Backup

1. Log in as admin
2. Navigate to **Backup** in the sidebar
3. Click **Download Backup**
4. A `.sql` database dump file will be downloaded to your browser
5. Store the file in a secure location

### Restoring a Backup

1. Navigate to **Backup** in the sidebar
2. Click **Upload & Restore** and select a `.sql` backup file
3. Confirm the warning that all existing data will be replaced
4. After restore completes, refresh the page

### Offsite Backup Strategy

For automated offsite backups, set up a cron job on the server:

```bash
# Example: daily backup to a local directory
sudo -u serverinv crontab -e

# Add this line for daily backups at 2 AM:
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql

# Optionally copy to a remote server via scp/rsync:
0 3 * * * scp /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql user@backup-server:/backups/
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u serverinv -n 50 --no-pager

# Verify .env exists and has correct DATABASE_URL
cat /opt/serverinv/server/.env

# Test database connection
sudo -u serverinv psql "postgres://serverinv:password@localhost:5432/serverinv" -c "SELECT 1;"
```

### nginx returns 502 Bad Gateway

The backend isn't running or isn't listening on port 3000:

```bash
sudo systemctl status serverinv
curl http://127.0.0.1:3000/api/auth/login  # Should return 400, not connection refused
```

### Frontend shows blank page

Rebuild the client:

```bash
cd /opt/serverinv/client
sudo -u serverinv npm run build
ls /opt/serverinv/client/dist/  # Should contain index.html and assets/
```

### Permission errors

```bash
sudo chown -R serverinv:serverinv /opt/serverinv
```
