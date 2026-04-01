# ServerInv VirtualMin GPL Deployment & Management Guide

Complete guide for deploying and managing ServerInv on VirtualMin GPL hosting environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Management](#management)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)
- [Backup & Restore](#backup--restore)

---

## Overview

VirtualMin GPL is a free, open-source hosting control panel that provides powerful server management features similar to cPanel and DirectAdmin. This guide covers deploying ServerInv to VirtualMin-managed servers with Apache web server and PM2 process manager.

### Key Features of VirtualMin Deployment

- **Free Control Panel**: Open-source alternative to cPanel
- **PM2 Process Manager**: Reliable Node.js application management
- **Apache Integration**: Standard web server with .htaccess support
- **Let's Encrypt SSL**: Free automated SSL certificates
- **Full SSH Access**: Complete control over your environment

### Requirements

- **Server**: Ubuntu 20.04+ or Debian 10+ with VirtualMin GPL installed
- **Node.js**: Version 20.x or later
- **Database**: PostgreSQL 14+ or MySQL 8+ / MariaDB 10+
- **Memory**: Minimum 1 GB RAM recommended
- **Storage**: At least 500 MB free space
- **Domain**: A domain or subdomain pointed to your server

---

## Prerequisites

### Prerequisites Check

Before deploying, ensure you have the required software installed:

```bash
# SSH into your account
ssh username@yourdomain.com

# Check Node.js version (must be 20+)
node --version

# Check npm
npm --version

# Check tsx (TypeScript executor)
tsx --version

# Check nvm (optional but recommended)
nvm --version

# Check PM2
pm2 --version
```

### Installing Missing Prerequisites

**Node.js 20.x via NVM (Recommended):**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

**Install TSX (TypeScript Executor):**

```bash
npm install -g tsx

# Verify installation
tsx --version
```

**Install PM2 (Process Manager):**

```bash
npm install -g pm2

# Verify installation
pm2 --version

# Configure PM2 to start on reboot
PM2_PATH=$(which pm2)
(crontab -l 2>/dev/null; echo "@reboot sleep 30 && $PM2_PATH resurrect") | crontab -
```

**Quick Verification Test:**
```bash
# Test that all tools work
node -e "console.log('Node.js works!')"
npm -v
tsx --help | head -1
pm2 -v

# If all commands succeed, you're ready to deploy
```

---

## Installation

### Step 1: Deploy the Application

```bash
# SSH into your account
ssh username@yourdomain.com

# Clone or upload the project
git clone https://github.com/yourusername/ServerInv.git ~/serverinv
cd ~/serverinv

# Or if already uploaded, navigate to directory
cd ~/serverinv

# Run deployment script
bash deploy/setup-shared.sh
```

The script will auto-detect VirtualMin and provide VirtualMin-specific instructions.

**Follow the prompts:**
- **Domain name**: Your subdomain (e.g., `serverinv.yourdomain.com`)
- **Database type**: Choose MySQL or PostgreSQL
- **Database name**: Your database name (e.g., `username_serverinv`)
- **Database username**: Your database username
- **Database password**: Your database password
- **App directory**: Leave default (`~/serverinv`) or customize
- **Application URL**: Full URL (defaults to https://yourdomain, used for password reset and CORS)
- **CORS origins**: Shows derived values, optionally add additional allowed domains
- **SMTP configuration**: Optional email settings for password reset functionality

### Step 2: Start Node.js Application

VirtualMin uses **PM2 process manager** for Node.js applications:

```bash
# Application should be auto-started by deployment script
# Check status
pm2 status serverinv

# View logs
pm2 logs serverinv

# Restart if needed
pm2 restart serverinv

# Stop application
pm2 stop serverinv

# Start application
pm2 start serverinv
```

**Note**: The deployment script automatically installs PM2, starts the application, and configures auto-start on reboot.

### Step 3: Configure Virtual Server

1. Log into VirtualMin web interface
2. Go to **"Create Virtual Server"** (or use existing virtual server)
3. If creating new:
   - **Domain name**: `serverinv.yourdomain.com`
   - **Administration username**: Your existing user
   - **Administration password**: Your password
   - Click "Create Server"
4. If using existing server:
   - Go to **"Server Configuration"** > **"Website Options"**

### Step 4: Set Document Root

**Option A: Copy Files to public_html (Recommended)**

VirtualMin typically serves from `~/public_html`. Symbolic links may not work properly, so copy files instead:

```bash
# Remove old public_html if exists
rm -rf ~/public_html

# Create fresh directory
mkdir -p ~/public_html

# Copy client files
cp -r ~/serverinv/client/dist/* ~/public_html/

# Verify files are present
ls ~/public_html/
# Should show: assets/  index.html

# Create sync script for future updates
cat > ~/serverinv/scripts/sync-client.sh << 'SYNCSCRIPT'
#!/bin/bash
echo "Syncing client files to public_html..."
rsync -av --delete ~/serverinv/client/dist/ ~/public_html/
echo "✓ Client files synced to public_html"
SYNCSCRIPT

chmod +x ~/serverinv/scripts/sync-client.sh
```

**⚠️ Important:** After rebuilding the client, run `~/serverinv/scripts/sync-client.sh` to sync changes to public_html.

**Option B: Via VirtualMin UI (Alternative)**
1. Go to **"Server Configuration"** > **"Website Options"**
2. Set **"Document root"** to: `/home/yourusername/serverinv/client/dist`
3. Click "Save"
4. Reload Apache configuration

**Option C: Via Symbolic Link (May Not Work)**
```bash
# Try symbolic link (often doesn't work on VirtualMin)
rm ~/public_html
ln -s ~/serverinv/client/dist ~/public_html
```

### Step 5: Configure Reverse Proxy

**Option A: Via VirtualMin UI (if available)**
1. Go to **"Server Configuration"** > **"Edit Proxy Balancers"**
2. Add new proxy:
   - **URL path**: `/api`
   - **Destination URL**: `http://localhost:3000/api`
   - **Proxy type**: HTTP
3. Click "Create"

**Option B: Manual .htaccess (Most Common)**

Create or edit `~/public_html/.htaccess` (or `~/serverinv/client/dist/.htaccess` if using document root method):

```apache
# Enable rewrite engine
RewriteEngine On

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

# SPA routing - serve index.html for non-file requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Note**: If proxy doesn't work, you may need to enable `mod_proxy`:
```bash
# Contact your hosting provider or if you have root access:
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

### Step 6: Enable SSL Certificate

**Option A: Via VirtualMin UI (Recommended)**
1. Go to **"Server Configuration"** > **"SSL Certificate"**
2. Select **"Let's Encrypt"** tab
3. Enter domain: `serverinv.yourdomain.com`
4. Click **"Request Certificate"**
5. Wait for installation (~1-2 minutes)

**Option B: Via Command Line**
```bash
# Request Let's Encrypt certificate
virtualmin generate-letsencrypt-cert --domain serverinv.yourdomain.com
```

**Option C: Via Certbot**
```bash
# If virtualmin command isn't available
sudo certbot --apache -d serverinv.yourdomain.com
```

### Step 7: Configure Domain DNS

Ensure your domain points to your server:

1. Go to your domain registrar's DNS settings
2. Add/update A record:
   - **Host**: `serverinv` (or subdomain name)
   - **Type**: A
   - **Value**: Your server's IP address
   - **TTL**: 3600 (1 hour) or default
3. Wait for DNS propagation (5-30 minutes)

### Step 8: Test Deployment

1. Visit `https://serverinv.yourdomain.com`
2. You should see the ServerInv login page
3. Login with username `admin` and password `admin`
4. **⚠️ IMPORTANT: You will be forced to change the admin password on first login** (new security feature)
5. Test functionality:
   - Create a test server
   - Edit it
   - Delete it
   - Test backup feature

---

## Configuration

### Environment Variables

Edit `~/serverinv/server/.env`:

```bash
# Database connection
DATABASE_URL=postgresql://user:password@localhost:5432/database
# or
DATABASE_URL=mysql://user:password@localhost:3306/database

# JWT secret for authentication (generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# Application URL (for CORS and password reset emails)
APP_URL=https://serverinv.yourdomain.com

# CORS allowed origins (comma-separated, auto-set from APP_URL)
ALLOWED_ORIGINS=https://serverinv.yourdomain.com

# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=production

# Email configuration (optional, for password reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-email-password
EMAIL_FROM=ServerInv <noreply@yourdomain.com>

# SFTP backup configuration (optional)
SFTP_HOST=backup.example.com
SFTP_PORT=22
SFTP_USER=backup-user
SFTP_PASS=backup-password
SFTP_PATH=/backups/serverinv
```

**Restart after configuration changes:**
```bash
pm2 restart serverinv
```

### Apache Configuration

If you need custom Apache settings, create `~/public_html/.htaccess`:

```apache
# ServerInv Apache Configuration

# Enable rewrite engine
RewriteEngine On

# Force HTTPS (optional but recommended)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

# SPA routing - serve index.html for non-file requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

---

## Management

### PM2 Process Management

**Check Application Status:**
```bash
pm2 status serverinv
```

**View Real-Time Logs:**
```bash
pm2 logs serverinv

# View only error logs
pm2 logs serverinv --err

# View last 100 lines
pm2 logs serverinv --lines 100

# Stop following logs (Ctrl+C)
```

**Restart Application:**
```bash
pm2 restart serverinv

# Restart with logs
pm2 restart serverinv && pm2 logs serverinv
```

**Stop/Start Application:**
```bash
# Stop
pm2 stop serverinv

# Start
pm2 start serverinv

# Delete from PM2 (removes from process list)
pm2 delete serverinv
```

**View Detailed Information:**
```bash
pm2 show serverinv
```

**Monitor Resources:**
```bash
pm2 monit
```

**Save PM2 Process List (for auto-restart on reboot):**
```bash
pm2 save
```

### Management Scripts

Convenient wrapper scripts created during deployment:

```bash
# Check status and recent logs
~/serverinv/scripts/status.sh

# Restart application
~/serverinv/scripts/restart.sh

# View live logs
~/serverinv/scripts/logs.sh

# Stop application
~/serverinv/scripts/stop.sh

# Start application
~/serverinv/scripts/start.sh

# Sync client files to public_html (if using copy method)
~/serverinv/scripts/sync-client.sh
```

### Apache/Web Server Logs

**Via VirtualMin Interface:**
1. Go to "Logs and Reports" > "Apache Error Log"
2. Or "Apache Access Log" for request logs

**Via Command Line:**
```bash
# Error log
tail -f ~/logs/error_log

# Access log
tail -f ~/logs/access_log

# Search for specific errors
grep "serverinv" ~/logs/error_log | tail -20
```

### Database Management

**Via VirtualMin UI:**
1. Go to "Edit Databases" > "Manage Database"
2. Or use phpMyAdmin/Adminer if installed

**Via Command Line:**

**PostgreSQL:**
```bash
psql -h localhost -U dbuser -d dbname

# List tables
\dt

# Query servers
SELECT * FROM servers LIMIT 10;

# Exit
\q
```

**MySQL:**
```bash
mysql -h localhost -u dbuser -p dbname

# List tables
SHOW TABLES;

# Query servers
SELECT * FROM servers LIMIT 10;

# Exit
exit;
```

---

## Updating

### Quick Update (Server Code Only)

Most common scenario when only backend code changed:

```bash
cd ~/serverinv
git pull
cd server
npm run build
pm2 restart serverinv

# Check logs
pm2 logs serverinv --lines 50
```

### Full Update (Server + Client)

When both frontend and backend changed:

```bash
cd ~/serverinv
git pull

# Install dependencies (if package.json changed)
npm install

# Rebuild server
cd server
npm run build

# Rebuild client
cd ../client
npm run build

# Sync to public_html (IMPORTANT if using copy method)
~/serverinv/scripts/sync-client.sh

# Restart application
pm2 restart serverinv

# Verify and check logs
pm2 status serverinv
pm2 logs serverinv --lines 50 --nostream
```

**⚠️ Important for VirtualMin:** If you copied client files to `~/public_html` during setup (instead of using symlink), you **MUST** run the sync script after rebuilding the client, or frontend changes won't appear.

### Database Migrations

If update includes database schema changes:

```bash
cd ~/serverinv/server

# Ensure tsx is available
tsx --version

# If tsx is missing
npm install -g tsx

# Run migrations
npx tsx src/db/migrate.ts

# Restart application
pm2 restart serverinv
```

### Resetting Admin Password

If you've lost access or need to reset:

```bash
cd ~/serverinv/server
npx tsx src/db/reset-admin.ts admin newpassword

# Restart application
pm2 restart serverinv
```

### Automated Update Script

For convenience, use the update script:

```bash
cd ~/serverinv
bash deploy/update-shared.sh
```

---

## Troubleshooting

### Node.js or TSX Command Not Found

```bash
# Verify Node.js installation
node --version
npm --version
tsx --version

# If commands not found, ensure nvm is loaded
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Set default Node.js version
nvm use 20
nvm alias default 20

# Install missing tsx globally
npm install -g tsx

# Verify PATH includes npm global packages
echo $PATH | grep -o "$HOME/.nvm"
```

**Make nvm permanent in shell:**
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
source ~/.bashrc
```

### Deployment Script Fails with "tsx: command not found"

```bash
# Install tsx globally
npm install -g tsx

# If permission denied, use npm prefix
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g tsx

# Verify
which tsx
tsx --version
```

### PM2 Command Not Found

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
which pm2
pm2 --version

# If still not found, check npm global path
npm config get prefix
# Add to PATH if needed
export PATH="$(npm config get prefix)/bin:$PATH"
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.bashrc
```

### PM2 App Not Starting

```bash
# Check PM2 logs for errors
pm2 logs serverinv --err

# Try starting with full path
cd ~/serverinv/server
pm2 delete serverinv
pm2 start dist/index.js --name serverinv --env production

# Check if port 3000 is already in use
netstat -tlnp | grep 3000
# Or: ss -tlnp | grep 3000

# If port is in use, change PORT in .env
echo "PORT=3001" >> ~/serverinv/server/.env
pm2 restart serverinv
```

### PM2 App Not Restarting After Reboot

```bash
# Check crontab for PM2 resurrect
crontab -l | grep pm2

# If missing, add it
PM2_PATH=$(which pm2)
(crontab -l 2>/dev/null; echo "@reboot sleep 30 && $PM2_PATH resurrect") | crontab -

# Save current PM2 process list
pm2 save

# Test by simulating reboot
pm2 kill
pm2 resurrect
```

### PM2 Using Wrong Node.js Version

```bash
# Check Node.js version PM2 is using
pm2 show serverinv | grep "exec mode"

# Update PM2 to use correct Node.js
pm2 delete serverinv
which node  # Get full path
pm2 start dist/index.js --name serverinv --interpreter $(which node) --env production
pm2 save
```

### 502 Bad Gateway

```bash
# Verify backend is running
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}

# If not running, check PM2
pm2 status serverinv
pm2 logs serverinv --err

# Check if proxy is configured
cat ~/public_html/.htaccess
# Should contain RewriteRule for /api

# Verify Apache modules
httpd -M | grep proxy
# Should show proxy_module and proxy_http_module

# If modules missing, contact hosting provider
```

### SSL Certificate Fails

```bash
# Ensure domain points to server
dig +short serverinv.yourdomain.com
# Should return your server IP

# Verify port 80 and 443 are open
sudo netstat -tlnp | grep -E ':(80|443)'

# Check Let's Encrypt logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Retry certificate generation
virtualmin generate-letsencrypt-cert --domain serverinv.yourdomain.com
```

### Application Not Accessible

**Checklist:**
- ✅ Verify DNS points to correct server IP: `dig +short yourdomain.com`
- ✅ Check firewall allows ports 80 and 443
- ✅ Verify document root is correct: `~/public_html` or `~/serverinv/client/dist`
- ✅ Check Apache is running: `sudo systemctl status apache2`
- ✅ Verify PM2 app is running: `pm2 status serverinv`
- ✅ Check `.htaccess` exists and is readable
- ✅ View Apache error logs: `tail -f ~/logs/error_log`

### Database Connection Errors

```bash
# Verify DATABASE_URL is correct
cat ~/serverinv/server/.env | grep DATABASE_URL

# Test PostgreSQL connection
psql -h localhost -U dbuser -d dbname -c "\dt"

# Test MySQL connection
mysql -h localhost -u dbuser -p -e "USE dbname; SHOW TABLES;"

# Check application logs
pm2 logs serverinv --err | grep -i database
```

### Client Files Not Updating

```bash
# If using copy method (not symlink), sync files
~/serverinv/scripts/sync-client.sh

# Verify files are in public_html
ls -la ~/public_html/

# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

# Check Apache is serving the right directory
curl -I https://serverinv.yourdomain.com | grep -i server
```

### Performance Issues

```bash
# Check system resources
free -h  # Memory usage
df -h    # Disk usage
top      # CPU and memory by process

# Check PM2 resource usage
pm2 monit

# View slow queries (if database is slow)
# PostgreSQL:
psql -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# MySQL:
mysql -e "SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;"
```

---

## Backup & Restore

### In-App Backup (Recommended)

1. Login to ServerInv as admin
2. Go to **Backup & Restore** page
3. Click **"Download Backup"**
4. Choose backup options:
   - Include users table (for full backup)
   - Exclude users table (for data-only backup)
5. Save the `.sql` file securely

**Restore:**
1. Go to **Backup & Restore** page
2. Click **"Upload Backup"**
3. Select backup mode:
   - **Clean Restore**: Replace all data (WARNING: deletes everything)
   - **Merge Mode**: Keep existing + add new (with conflict resolution)
4. Choose conflict resolution (if merge mode):
   - **Keep Existing**: Preserve current data on ID conflicts
   - **Use Restored**: Replace with backup data on ID conflicts
5. Upload `.sql` file
6. Wait for completion

### VirtualMin Backup System

**Create Backup Schedule:**
1. Log into VirtualMin
2. Go to **"Backup and Restore"**
3. Click **"Scheduled Backups"**
4. Create new schedule:
   - Include home directory
   - Include databases
   - Set frequency (daily/weekly)
   - Choose destination (local or remote)

**Manual Backup:**
```bash
# Backup database
pg_dump -h localhost -U dbuser dbname > ~/backups/serverinv-$(date +%Y%m%d).sql
# or for MySQL:
mysqldump -h localhost -u dbuser -p dbname > ~/backups/serverinv-$(date +%Y%m%d).sql

# Backup application files
tar -czf ~/backups/serverinv-files-$(date +%Y%m%d).tar.gz ~/serverinv

# Backup .env (contains secrets!)
cp ~/serverinv/server/.env ~/backups/.env.backup
```

**Restore from Manual Backup:**
```bash
# Restore database
psql -h localhost -U dbuser dbname < ~/backups/serverinv-20260401.sql
# or for MySQL:
mysql -h localhost -u dbuser -p dbname < ~/backups/serverinv-20260401.sql

# Restore files (optional)
cd ~
tar -xzf ~/backups/serverinv-files-20260401.tar.gz

# Restart application
pm2 restart serverinv
```

### SFTP Offsite Backup

Configure in `~/serverinv/server/.env`:

```bash
SFTP_HOST=backup.example.com
SFTP_PORT=22
SFTP_USER=backup-user
SFTP_PASS=backup-password
SFTP_PATH=/backups/serverinv
```

Backups will automatically upload to SFTP server when downloaded through the web interface.

---

## Additional Resources

- [Main Deployment Guide](./deployment-guide.md) - VPS deployment with systemd
- [Shared Hosting Guide](./shared-hosting-guide.md) - cPanel and DirectAdmin
- [Update Guide](./update-guide.md) - Updating existing installations
- [User Guide](./user-guide.md) - Application usage
- [Security Guide](./SECURITY.md) - Security best practices
- [Troubleshooting](./shared-hosting-guide.md#troubleshooting) - Common issues

---

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/yourusername/ServerInv/issues
- Documentation: https://github.com/yourusername/ServerInv/tree/main/docs

---

**Last Updated**: April 2026
**ServerInv Version**: 1.1.0+
