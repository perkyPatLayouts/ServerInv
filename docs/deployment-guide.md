# ServerInv Deployment Guide

## Deployment Options

ServerInv supports two deployment environments:

### 🖥️ VPS/Dedicated Server (This Guide)

- **Best for**: Production use, large teams, high traffic
- **Requirements**: Root access, Ubuntu/Debian server
- **Backup method**: Native pg_dump (fast)
- **Performance**: Dedicated resources
- **Setup time**: ~15 minutes
- **Cost**: ~$5-20/month

**Continue reading below for VPS deployment.**

### 🌐 Shared Hosting (cPanel/DirectAdmin)

- **Best for**: Personal use, small teams, budget-conscious
- **Requirements**: cPanel or DirectAdmin, PostgreSQL support
- **Backup method**: Pure Node.js (slower but functional)
- **Performance**: Shared resources
- **Setup time**: ~15 minutes
- **Cost**: ~$3-10/month

**👉 [Read the Shared Hosting Deployment Guide](./shared-hosting-guide.md)**

---

## VPS/Dedicated Server Deployment

Deploy ServerInv on a fresh Ubuntu 24.04 or Debian 12 VPS.

## Prerequisites

- A VPS with Ubuntu 24.04 or Debian 12
- Root or sudo access
- A domain name pointed to the server's IP (optional, for HTTPS)
- At least 1 GB RAM, 10 GB disk

## Quick Deploy (Automated)

The `deploy/setup.sh` script handles everything automatically with interactive prompts:

```bash
# Clone or upload the project to the server
git clone <your-repo-url> /tmp/serverinv
cd /tmp/serverinv

# Run the setup script as root
sudo bash deploy/setup.sh
```

### Interactive Setup

The script will prompt you for:

1. **Domain name** - The domain where ServerInv will be accessible (e.g., `serverinv.example.com`)
2. **Web server choice** - Nginx or Apache (detects existing installations and warns about conflicts)
3. **Confirmation** - If existing configurations might be replaced

### What the Script Does

1. Detects existing Nginx/Apache installations
2. Installs Node.js 20.x, PostgreSQL, and chosen web server (if needed)
3. Creates a `serverinv` system user
4. Creates the PostgreSQL database with a random password
5. Copies the app to `/opt/serverinv`
6. Generates `.env` with database URL and JWT secret
7. Installs dependencies and builds the frontend
8. Runs database migrations and seed default data
9. Configures systemd service for auto-start
10. Configures chosen web server (Nginx or Apache) as reverse proxy
11. Obtains SSL certificate via Let's Encrypt

### Multiple Sites Support

The script is designed to work alongside other sites:
- Won't disable default site if other sites exist
- Detects domain conflicts before proceeding
- Creates site-specific configuration files
- Preserves existing web server configurations

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
- Admin user: `admin` / `admin` (role: admin)
- Currencies: USD, EUR, GBP
- Server types: VPS, Dedicated, Shared
- Operating systems: Ubuntu 24.04, Ubuntu 22.04, Debian 12, Debian 11, CentOS 9, AlmaLinux 9
- Billing periods: Hourly, Monthly, Quarterly, Yearly, 2 Yearly, 3 Yearly
- Payment methods: PayPal, Credit Card, Cash, Digital Currency

**Note:** Change the default admin password immediately after first login!

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

### 10. Configure Web Server

Choose either Nginx (recommended) or Apache.

#### Option A: Nginx

Copy and configure:

```bash
sudo cp /opt/serverinv/deploy/serverinv.nginx /etc/nginx/sites-available/serverinv

# Edit the file and replace server_name _ with your domain
sudo nano /etc/nginx/sites-available/serverinv

# Enable the site
sudo ln -sf /etc/nginx/sites-available/serverinv /etc/nginx/sites-enabled/serverinv

# Only remove default if this is the only site
# sudo rm -f /etc/nginx/sites-enabled/default

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
- Increased timeout (300s) for backup/restore operations

If using a domain name, replace `server_name _;` with `server_name yourdomain.com;`.

#### Option B: Apache

Enable required modules and configure:

```bash
# Enable required modules
sudo a2enmod proxy proxy_http rewrite ssl headers

# Copy and configure
sudo cp /opt/serverinv/deploy/serverinv.apache /etc/apache2/sites-available/serverinv.conf

# Edit the file and replace yourdomain.com with your actual domain
sudo nano /etc/apache2/sites-available/serverinv.conf

# Enable the site
sudo a2ensite serverinv.conf

# Only disable default if this is the only site
# sudo a2dissite 000-default.conf

sudo apachectl configtest && sudo systemctl reload apache2
```

The Apache config (`deploy/serverinv.apache`):

```apache
<VirtualHost *:80>
    ServerName yourdomain.com

    DocumentRoot /opt/serverinv/client/dist

    ProxyTimeout 300

    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    <Directory /opt/serverinv/client/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/serverinv-error.log
    CustomLog ${APACHE_LOG_DIR}/serverinv-access.log combined
</VirtualHost>
```

How it works:
- Serves the built React frontend from `/opt/serverinv/client/dist`
- Proxies `/api/` requests to the Node.js backend on port 3000
- Rewrites URLs for client-side routing
- Increased timeout (300s) for backup/restore operations

---

## HTTPS with Certbot

### For Nginx

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### For Apache

```bash
sudo apt-get install -y certbot python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

Certbot will:
- Obtain a Let's Encrypt certificate
- Modify the web server config for SSL
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

### Web server returns 502 Bad Gateway (Nginx) or 503 Service Unavailable (Apache)

The backend isn't running or isn't listening on port 3000:

```bash
sudo systemctl status serverinv
curl http://127.0.0.1:3000/api/auth/login  # Should return 400, not connection refused
```

For Apache-specific issues:

```bash
# Check Apache logs
sudo tail -f /var/log/apache2/serverinv-error.log

# Verify proxy modules are enabled
sudo apache2ctl -M | grep proxy

# Test configuration
sudo apachectl configtest
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
