# ServerInv Shared Hosting Deployment Guide

This guide covers deploying ServerInv to shared hosting environments running cPanel or DirectAdmin with Apache, LiteSpeed, or other web servers.

**Already deployed?** See the **[Update Guide](./update-guide.md)** for updating an existing installation.

## Table of Contents

- [Requirements](#requirements)
- [Before You Begin](#before-you-begin)
- [Quick Start](#quick-start)
- [cPanel Deployment](#cpanel-deployment)
- [DirectAdmin Deployment](#directadmin-deployment)
- [LiteSpeed Configuration](#litespeed-configuration)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Performance Considerations](#performance-considerations)
- [Updates & Maintenance](#updates--maintenance)
- [Backup & Restore](#backup--restore)
- [Limitations](#limitations)

## Requirements

### Hosting Requirements

- **Control Panel**: cPanel 11.110+ or DirectAdmin 1.60+
- **Web Server**: Apache, LiteSpeed, or compatible (reads .htaccess files)
- **Node.js**: Version 20 or higher
- **Database**: MySQL 8+ / MariaDB 10+ (recommended) or PostgreSQL 12+ (if available)
- **Disk Space**: ~200MB for application + database space
- **Memory**: Minimum 512MB available
- **Shell Access**: SSH access required for deployment

**Note**: LiteSpeed is fully supported and includes optimized caching configuration.

### Database Requirements

Choose one of the following database options:

**MySQL/MariaDB (Recommended for Shared Hosting)**
- MySQL 8+ or MariaDB 10+ database
- CREATE, DROP, INSERT, UPDATE, DELETE privileges
- Ability to create tables, indexes, and foreign keys
- Most commonly available on shared hosting
- Remote access not required (localhost is fine)

**PostgreSQL (Alternative if Available)**
- PostgreSQL 12+ database
- Same privileges as above
- Less common on shared hosting but fully supported

### Technical Requirements

- Basic command-line knowledge
- Access to control panel (cPanel or DirectAdmin)
- Domain name or subdomain
- SSL certificate (Let's Encrypt recommended)

## Before You Begin

### 1. Create Database

Choose MySQL/MariaDB (most common) or PostgreSQL (if available):

#### Option A: MySQL/MariaDB (Recommended)

**cPanel:**
1. Log into cPanel
2. Go to "MySQL Databases"
3. Create new database (e.g., `username_serverinv`)
4. Create new user with strong password
5. Add user to database with ALL PRIVILEGES

**DirectAdmin:**
1. Log into DirectAdmin
2. Go to "MySQL Management"
3. Create new database
4. Create new user with strong password
5. Grant all privileges

#### Option B: PostgreSQL (Alternative)

**cPanel:**
1. Log into cPanel
2. Go to "PostgreSQL Databases"
3. Create new database (e.g., `username_serverinv`)
4. Create new user with strong password
5. Add user to database with ALL PRIVILEGES

**DirectAdmin:**
1. Log into DirectAdmin
2. Go to "PostgreSQL Management"
3. Create new database
4. Create new user with strong password
5. Grant all privileges

### 2. Install/Enable Node.js

**cPanel:**
1. Go to "Setup Node.js App"
2. Click "Create Application"
3. Select Node.js 20 or higher
4. Note the installation path

**DirectAdmin:**
1. Go to "Node.js Selector"
2. Install Node.js 20 or higher
3. Enable for your account

### 3. Enable SSH Access

Contact your hosting provider if SSH access is not enabled. You'll need SSH to run the deployment script.

## Quick Start

```bash
# 1. Upload ServerInv files to your hosting account
# (via SFTP, control panel file manager, or git clone)

# 2. Connect via SSH
ssh username@yourdomain.com

# 3. Navigate to the project directory
cd ~/serverinv

# 4. Run the deployment script
bash deploy/setup-shared.sh

# 5. Follow the interactive prompts
```

The script will:
- Detect your control panel (cPanel or DirectAdmin)
- Prompt for configuration (domain, database credentials)
- Install dependencies
- Build the application
- Set up the database
- Provide next-step instructions

## cPanel Deployment

### Step 1: Deploy the Application

```bash
# SSH into your account
ssh username@yourdomain.com

# Navigate to the project directory
cd ~/serverinv

# Run deployment script
bash deploy/setup-shared.sh
```

Follow the prompts:
- **Domain name**: Your subdomain (e.g., `serverinv.yourdomain.com`)
- **Database type**: Choose MySQL or PostgreSQL
- **Database name**: Your database name (e.g., `username_serverinv`)
- **Database username**: Your database username
- **Database password**: Your database password
- **App directory**: Leave default (`~/serverinv`) or customize

### Step 2: Register Node.js Application

1. Log into cPanel
2. Go to "Setup Node.js App"
3. You should see `serverinv` listed
4. Click "Run NPM Install" (if prompted)
5. Click "Start Application"
6. Note the application URL (e.g., `http://127.0.0.1:3000`)

If not auto-registered:
1. Click "Create Application"
2. Set:
   - **Node.js version**: 20 or higher
   - **Application mode**: Production
   - **Application root**: `~/serverinv/server`
   - **Application startup file**: `dist/index.js`
   - **Application port**: 3000

### Step 3: Configure Domain

1. In cPanel, go to "Domains" (or "Subdomains")
2. Create subdomain: `serverinv.yourdomain.com`
3. Set document root to: `~/serverinv/client/dist`
4. Save

### Step 4: Configure Reverse Proxy

Create or edit `~/serverinv/client/dist/.htaccess`:

**For Apache (default):**

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

**For LiteSpeed (optimized with caching):**

```apache
# LiteSpeed optimized configuration
<IfModule LiteSpeed>
  RewriteEngine On

  # Enable LiteSpeed Cache for static assets
  <FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>

  # Disable caching for index.html (SPA routing)
  <Files "index.html">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
  </Files>

  # Proxy API requests to Node.js backend
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

  # SPA routing - serve index.html for non-file requests
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Universal configuration (works on both Apache and LiteSpeed):**

```apache
RewriteEngine On

# Cache static assets (works on both Apache and LiteSpeed)
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$">
  Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

# SPA routing - serve index.html for non-file requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Important**: Replace `127.0.0.1:3000` with the actual port from Step 2 if different.

**Note**: The deployment script auto-detects your web server and provides the appropriate configuration.

### Step 5: Enable SSL

1. In cPanel, go to "SSL/TLS Status"
2. Find your domain `serverinv.yourdomain.com`
3. Click "Run AutoSSL" or "Include" (for Let's Encrypt)
4. Wait for certificate installation (~1-2 minutes)

### Step 6: Test Deployment

1. Visit `https://serverinv.yourdomain.com`
2. Login with username `admin` and password `admin`
3. **Immediately change the admin password!**
4. Test backup/restore functionality

## DirectAdmin Deployment

### Step 1: Deploy the Application

```bash
# SSH into your account
ssh username@yourdomain.com

# Navigate to the project directory
cd ~/serverinv

# Run deployment script
bash deploy/setup-shared.sh
```

Follow the prompts (same as cPanel).

### Step 2: Start Node.js Application

**If using Node.js Selector:**
1. Log into DirectAdmin
2. Go to "Node.js Selector"
3. Find `serverinv` application
4. Click "Start"

**If using systemd (fallback):**
```bash
# The script already set this up
systemctl --user status serverinv
systemctl --user start serverinv  # if not running
```

### Step 3: Configure Domain

1. In DirectAdmin, go to "Domain Setup"
2. Create subdomain: `serverinv.yourdomain.com`
3. Set document root to: `~/serverinv/client/dist`
4. Save

### Step 4: Configure Reverse Proxy

**Option A: DirectAdmin Proxy Settings (if available)**
1. Go to domain settings for `serverinv.yourdomain.com`
2. Enable "Proxy"
3. Add proxy rule:
   - **Path**: `/api`
   - **Target**: `http://localhost:3000/api`

**Option B: Manual .htaccess**

Create `~/serverinv/client/dist/.htaccess`:

```apache
# Enable rewrite engine
RewriteEngine On

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Step 5: Enable SSL

1. In DirectAdmin, go to "SSL Certificates"
2. Select domain: `serverinv.yourdomain.com`
3. Click "Let's Encrypt"
4. Wait for installation

### Step 6: Test Deployment

Same as cPanel Step 6.

## LiteSpeed Configuration

LiteSpeed is a high-performance web server that's fully compatible with Apache .htaccess files. Many shared hosting providers (especially with cPanel) use LiteSpeed as a drop-in replacement for Apache.

### Benefits of LiteSpeed

- **Faster performance**: Up to 40x faster than Apache for static content
- **Built-in caching**: LiteSpeed Cache (LSCache) improves page load times
- **Lower resource usage**: More efficient memory and CPU usage
- **Apache compatibility**: Reads standard .htaccess files
- **HTTP/3 support**: Faster connections with QUIC protocol

### Detecting LiteSpeed

Check if your hosting uses LiteSpeed:

```bash
# SSH into your account
ssh username@yourdomain.com

# Check web server version
httpd -v
# or
lshttpd -v
```

If you see "LiteSpeed" in the output, you're running LiteSpeed.

### Optimized .htaccess for LiteSpeed

For best performance on LiteSpeed, use this optimized configuration in `~/serverinv/client/dist/.htaccess`:

```apache
# LiteSpeed optimized configuration for ServerInv
<IfModule LiteSpeed>
  # Enable rewrite engine
  RewriteEngine On

  # LiteSpeed Cache configuration
  # Cache static assets aggressively
  <FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
    # Enable LiteSpeed public cache
    Header set X-LiteSpeed-Cache-Control "public, max-age=31536000"
  </FilesMatch>

  # Don't cache index.html (for SPA routing)
  <Files "index.html">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set X-LiteSpeed-Cache-Control "no-cache"
  </Files>

  # Don't cache API responses
  <If "%{REQUEST_URI} =~ m#^/api#">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set X-LiteSpeed-Cache-Control "no-cache"
  </If>

  # Proxy API requests to Node.js backend
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

  # SPA routing - serve index.html for non-file requests
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Fallback for non-LiteSpeed servers
<IfModule !LiteSpeed>
  RewriteEngine On

  # Basic caching
  <FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$">
    Header set Cache-Control "public, max-age=31536000"
  </FilesMatch>

  # Proxy and SPA routing
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]

  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

This configuration:
- ✅ Caches static assets for 1 year (versioned filenames in Vite builds)
- ✅ Prevents caching of index.html (ensures SPA routing works)
- ✅ Prevents caching of API responses
- ✅ Uses LiteSpeed-specific cache headers when available
- ✅ Falls back to standard Apache configuration
- ✅ Works on both LiteSpeed and Apache

### LiteSpeed Cache Plugin (Optional)

If your cPanel includes "LiteSpeed Cache Manager":

1. Log into cPanel
2. Go to "LiteSpeed Cache Manager"
3. Enable caching for your domain
4. Configure:
   - **Public cache**: ON for static assets
   - **Private cache**: OFF (ServerInv uses client-side storage)
   - **Cache timeout**: 86400 seconds (1 day) for HTML, longer for assets

**Note**: The .htaccess configuration above already handles caching appropriately. The Cache Manager provides additional optimization.

### Performance Comparison

Based on typical shared hosting benchmarks:

| Metric | Apache | LiteSpeed |
|--------|--------|-----------|
| Static file serving | Baseline | 2-5x faster |
| Concurrent connections | Baseline | 3-10x more |
| Memory usage | Baseline | 30-50% less |
| CPU usage | Baseline | 20-40% less |

For ServerInv specifically:
- **Initial page load**: 20-40% faster with LiteSpeed cache
- **Asset loading**: 2-3x faster for cached assets
- **API performance**: Same (backend is Node.js, not affected by web server)

### Troubleshooting LiteSpeed

**Problem**: Cache not working

```bash
# Check if LiteSpeed Cache is enabled
cat ~/serverinv/client/dist/.htaccess | grep -i litespeed

# Check response headers
curl -I https://your-domain.com/assets/index.js
# Look for: X-LiteSpeed-Cache: hit
```

**Problem**: 503 errors when proxying API

Solution: Ensure mod_proxy is enabled (contact hosting support) or use the universal .htaccess configuration.

**Problem**: Changes not appearing

Solution: Clear LiteSpeed cache:
1. Log into cPanel
2. Go to "LiteSpeed Cache Manager"
3. Click "Flush All"

Or add to .htaccess temporarily:
```apache
# Force cache purge (remove after testing)
Header set X-LiteSpeed-Purge "*"
```

## Configuration

### Environment Variables

Located in `~/serverinv/server/.env`:

```bash
# Database (configured during deployment)
# MySQL/MariaDB (most common on shared hosting):
DATABASE_URL=mysql://user:pass@localhost:3306/dbname
# PostgreSQL (alternative):
# DATABASE_URL=postgres://user:pass@localhost:5432/dbname

# Security (auto-generated)
JWT_SECRET=<random-hex-string>

# Server
PORT=3000
NODE_ENV=production

# CORS (update if domain changes)
ALLOWED_ORIGINS=https://serverinv.yourdomain.com

# Shared hosting settings
TMP_DIR=/home/username/serverinv/tmp
DEPLOYMENT_TYPE=shared
CONTROL_PANEL=cpanel  # or directadmin
```

### Updating CORS Origins

If you change your domain or add additional domains:

```bash
cd ~/serverinv/server
nano .env  # or vi, vim, etc.

# Update ALLOWED_ORIGINS:
ALLOWED_ORIGINS=https://new-domain.com,https://old-domain.com

# Restart application
# cPanel: Restart in "Setup Node.js App"
# DirectAdmin: systemctl --user restart serverinv
```

## Troubleshooting

### Application Won't Start

**Check Node.js version:**
```bash
node -v  # Should be 20+
```

**Check application logs (cPanel):**
1. Go to "Setup Node.js App"
2. Click on `serverinv`
3. View error logs

**Check application logs (DirectAdmin):**
```bash
systemctl --user status serverinv
journalctl --user -u serverinv -n 50
```

**Common issues:**
- Port 3000 already in use → Change PORT in `.env`
- Database connection failed → Verify DATABASE_URL in `.env`
- Permission denied → Check file permissions: `chmod -R 755 ~/serverinv`

### Cannot Connect to Database

**Test MySQL Connection:**
```bash
# Direct MySQL test
mysql -u username -p database_name -e "SELECT 1;"

# Or via Node.js
cd ~/serverinv/server
node -e "require('dotenv').config(); const mysql = require('mysql2/promise'); mysql.createConnection(process.env.DATABASE_URL).then(conn => {console.log('OK'); conn.end();}).catch(err => {console.error(err); process.exit(1);});"
```

**Test PostgreSQL Connection:**
```bash
# Direct PostgreSQL test
psql "postgres://user:pass@localhost:5432/dbname" -c "SELECT 1;"

# Or via Node.js
cd ~/serverinv/server
node -e "require('dotenv').config(); const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT 1').then(() => {console.log('OK'); pool.end();}).catch(err => {console.error(err); process.exit(1);});"
```

If fails:
1. Verify database exists in control panel
2. Verify user has correct permissions
3. Check database service is running
4. Verify DATABASE_URL format matches your database type

### 502 Bad Gateway or API Errors

**Check if backend is running:**
```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok"}`

**Check .htaccess proxy configuration:**
```bash
cat ~/serverinv/client/dist/.htaccess
```

Ensure:
- `RewriteEngine On` is present
- Proxy port matches backend PORT
- mod_proxy is enabled (contact hosting support if not)

### Backup/Restore Slow

This is normal on shared hosting. The pure Node.js backup method is slower than native `pg_dump`:

- **Small database** (<100MB): 30-60 seconds
- **Medium database** (100-500MB): 2-5 minutes
- **Large database** (500MB-1GB): 5-15 minutes

For databases >1GB, consider VPS hosting instead.

### Application Not Loading After Domain Change

1. Update ALLOWED_ORIGINS in `.env`
2. Restart application
3. Clear browser cache
4. Check browser console for CORS errors

## Performance Considerations

### Resource Limits

Shared hosting has resource limits. Monitor usage:

**cPanel:**
- Go to "Resource Usage" in cPanel
- Monitor CPU, memory, and I/O usage

**DirectAdmin:**
- Go to "System Info & Files"
- Check resource usage

### Optimization Tips

1. **Database Indexing**: Already optimized by default migrations

2. **Keep Dependencies Updated:**
   ```bash
   cd ~/serverinv/server && npm outdated
   cd ~/serverinv/client && npm outdated
   ```

3. **Enable PostgreSQL Query Caching** (if available through control panel)

4. **Limit concurrent users**: Shared hosting typically handles 10-50 concurrent users well

### When to Upgrade to VPS

Consider VPS if:
- Regular resource limit errors
- Database >1GB
- >50 concurrent users
- Need faster backups
- Need custom server configuration

## Updates & Maintenance

### Updating ServerInv

**📋 For detailed update instructions, see the [Update Guide](./update-guide.md).**

Quick manual update for shared hosting:

```bash
cd ~/serverinv

# Backup first (use in-app backup feature)
# Then pull new code
git pull origin main

# Install dependencies
npm install

# Rebuild
cd client && npm run build
cd ../server && npm run build

# Run migrations
cd ../server && npx tsx src/db/migrate.ts

# Restart application (via control panel)
```

**Resetting admin credentials:**

```bash
cd ~/serverinv/server
npx tsx src/db/reset-admin.ts <username> <password>
```

### Maintenance Tasks

**Weekly:**
- Check application logs for errors
- Monitor resource usage

**Monthly:**
- Create database backup
- Check for ServerInv updates
- Review user accounts

**Quarterly:**
- Update dependencies
- Review security settings
- Test backup/restore process

## Backup & Restore

### In-App Backup (Recommended)

1. Log into ServerInv as admin
2. Go to Settings (or Backup page)
3. Click "Download Backup"
4. Save `.sql` file securely

**Note**: Backup generation uses pure Node.js on shared hosting. Expect 30 seconds to several minutes depending on database size.

### In-App Restore

1. Log into ServerInv as admin
2. Go to Settings (or Backup page)
3. Click "Upload Backup"
4. Select `.sql` file
5. Confirm restoration

**Warning**: This will replace ALL data. Backup first!

### Command-Line Backup

ServerInv automatically uses the correct backup service based on your database type.

**For MySQL/MariaDB:**
```bash
cd ~/serverinv/server

# The application will automatically use mysqlBackupService
# Best approach: Use the in-app backup feature (login as admin)
# This ensures the correct service is used automatically
```

**For PostgreSQL:**
```bash
cd ~/serverinv/server

# The application will automatically use pgBackupService
# Best approach: Use the in-app backup feature (login as admin)
# This ensures the correct service is used automatically
```

**Manual backup (advanced users):**
```bash
# MySQL
mysqldump -u username -p database_name > backup.sql

# PostgreSQL
pg_dump "postgres://user:pass@localhost:5432/dbname" > backup.sql
```

### Automated Backups

**Using cron (if available):**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd ~/serverinv/server && node -e "require('dotenv').config(); const {PgBackupService} = require('./dist/services/pgBackupService.js'); const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); const service = new PgBackupService(pool); service.generateBackup().then(sql => {const fs = require('fs'); const date = new Date().toISOString().split('T')[0]; fs.writeFileSync(\`~/backups/serverinv-\${date}.sql\`, sql); pool.end();});" >> ~/backup.log 2>&1
```

**Or use control panel backup features:**
- cPanel: "Backup Wizard"
- DirectAdmin: "Site Backup/Transfer"

## Limitations

### Compared to VPS Deployment

| Feature | VPS | Shared Hosting |
|---------|-----|----------------|
| Backup Speed | Fast (pg_dump) | Slower (pure Node.js) |
| Restore Speed | Fast (psql) | Slower (pure Node.js) |
| System Access | Full root | Limited user |
| Performance | Dedicated resources | Shared resources |
| Customization | Full control | Control panel only |
| Cost | $5-20/month | $3-10/month |

### Technical Limitations

1. **No root access**: Cannot install system packages
2. **Resource limits**: CPU, memory, I/O restrictions apply
3. **No custom PostgreSQL config**: Limited to hosting provider settings
4. **Slower backups**: 5-10x slower than native pg_dump
5. **Port restrictions**: Cannot use privileged ports (<1024)

### Recommended Use Cases

**Good for:**
- Small teams (1-10 users)
- Personal use
- Light/moderate usage
- Budget-conscious deployments
- Databases <500MB

**Not recommended for:**
- Large teams (>50 users)
- High-traffic scenarios
- Large databases (>1GB)
- Mission-critical deployments
- Custom infrastructure needs

## Getting Help

### Documentation

- [Main Documentation](./README.md)
- [VPS Deployment Guide](./deployment-guide.md)
- [API Reference](./api-reference.md)
- [Developer Guide](./developer-guide.md)

### Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/serverinv/issues)
- **Control Panel Support**: Contact your hosting provider for control panel issues
- **Community**: Check existing GitHub issues and discussions

### Common Questions

**Q: Can I migrate from shared hosting to VPS later?**
A: Yes! Backup your database, deploy to VPS using `deploy/setup.sh`, then restore the backup.

**Q: Can I use MySQL instead of PostgreSQL?**
A: Yes! ServerInv v1.1.0+ supports both MySQL/MariaDB and PostgreSQL. MySQL is actually the recommended choice for shared hosting as it's more commonly available. The system automatically detects your database type from the DATABASE_URL.

**Q: How many servers can I track?**
A: On shared hosting, recommend <10,000 servers. For larger inventories, use VPS.

**Q: Can I use a custom domain?**
A: Yes! Just update your domain configuration and ALLOWED_ORIGINS.

**Q: Is HTTPS required?**
A: Strongly recommended. Use Let's Encrypt (free) through your control panel.

**Q: Can I run multiple instances?**
A: Yes, but each needs separate database, port, and directory.

## Next Steps

After successful deployment:

1. ✅ Change admin password
2. ✅ Configure backup schedule
3. ✅ Test backup/restore
4. ✅ Add your servers to inventory
5. ✅ Invite additional users (if needed)
6. ✅ Review security settings
7. ✅ Bookmark your ServerInv URL

**Security Reminder**: Keep your JWT_SECRET secure and never commit it to version control.
