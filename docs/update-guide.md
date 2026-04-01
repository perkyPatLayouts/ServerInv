# ServerInv Update Guide

This guide covers updating an existing ServerInv installation on both VPS/dedicated servers and shared hosting.

**New installation?** See the [Deployment Guide](./deployment-guide.md) or [Shared Hosting Guide](./shared-hosting-guide.md).

---

## Before You Update

1. **Backup your database** - Use the built-in backup feature (Backup page in the app)
2. **Check compatibility** - Review release notes for breaking changes
3. **Have access credentials ready** - You may need sudo/root access

---

## VPS/Dedicated Server Updates

### Quick Update (Recommended)

Run the automated update script:

```bash
# For default installation (username: serverinv)
cd /opt/serverinv
sudo bash deploy/update.sh

# For custom installation (e.g., serverinv-prod)
cd /opt/serverinv-prod
sudo bash deploy/update.sh serverinv-prod
```

**Note**: If you used a custom username during deployment, you must specify it when updating. The script will auto-detect available installations if not specified.

The script will:
1. Stop the ServerInv service
2. **Clean build artifacts** (removes `*.tsbuildinfo` files to prevent conflicts)
3. **Automatically stash any local changes** (preserves uncommitted work)
4. Pull the latest code via `git pull`
5. Install any new dependencies
6. Rebuild the frontend
7. Run database migrations
8. **Optionally prompt to create/update admin credentials** (if login was lost)
9. **Optionally update APP_URL** (shows current value, then prompts for update - automatically sets ALLOWED_ORIGINS to both http and https)
10. **Optionally update ALLOWED_ORIGINS** (shows current derived values, then allows manual override if additional domains are needed)
11. **Optionally update SMTP settings** (shows current configuration, then prompts for updates if email functionality needs changes)
12. Restart the service and show status

**Note:** The configuration flow is designed to be intuitive:
- **APP_URL is configured first** - This is your main application URL
- **CORS origins are shown next** - Automatically derived from APP_URL (both http and https versions)
- **SMTP settings are shown last** - Current configuration is displayed before prompting for changes

When you update APP_URL, ALLOWED_ORIGINS is automatically set to include both `http://domain` and `https://domain`. You only need to manually override ALLOWED_ORIGINS if you need additional domains beyond your main domain.

**Automatic Conflict Handling:** The update script now automatically cleans build artifacts and stashes local changes before pulling, preventing common git conflicts. Any stashed changes are preserved and can be recovered using `git stash list` and `git stash pop` if needed.

### Manual Update

If you prefer to update manually:

**Important:** The variables shown below (`APP_USER`, `APP_DIR`, `SERVICE_NAME`) are **shell variables** that you type directly into your terminal session, not file edits. They're temporary variables used only for that SSH session to make the subsequent commands easier to adapt for different installations. Set them once at the beginning, then copy/paste the commands that follow.

```bash
# Set these shell variables in your terminal (not in a file)
# Replace 'serverinv' with your custom username if applicable
APP_USER="serverinv"  # or serverinv-prod, serverinv-staging, etc.
APP_DIR="/opt/${APP_USER}"
SERVICE_NAME="serverinv-${APP_USER}"

# Stop the service
sudo systemctl stop ${SERVICE_NAME}

cd ${APP_DIR}

# Clean build artifacts first
sudo -u ${APP_USER} find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Pull latest code (or upload new files)
# The automated script handles stashing, but for manual updates:
sudo -u ${APP_USER} git pull

# If git pull fails with conflicts, stash local changes first:
# sudo -u ${APP_USER} git stash push -m "Manual stash $(date +%Y-%m-%d_%H:%M:%S)"
# sudo -u ${APP_USER} git pull
# sudo -u ${APP_USER} git stash pop  # (optional, to restore local changes)

# Install any new dependencies
sudo -u ${APP_USER} npm install

# Rebuild frontend
cd ${APP_DIR}/client
sudo -u ${APP_USER} npm run build

# Run any new migrations (do NOT run drizzle-kit generate on server)
cd ${APP_DIR}/server
sudo -u ${APP_USER} npx tsx src/db/migrate.ts

# Restart backend
sudo systemctl start ${SERVICE_NAME}
sudo systemctl status ${SERVICE_NAME}
```

**Why use variables?** The variable approach lets you set your installation name once at the top, then copy/paste all subsequent commands without modification. This is especially useful when managing multiple ServerInv installations on the same server.

**Note:** These variables only exist in your current terminal session. If you disconnect and reconnect, you'll need to set them again. Alternatively, use the automated `deploy/update.sh` script which handles all of this automatically.

**Examples for different installations:**

**Default installation** (`serverinv`):
```bash
sudo systemctl stop serverinv-serverinv
cd /opt/serverinv
sudo -u serverinv git pull
sudo -u serverinv npm install
cd /opt/serverinv/client && sudo -u serverinv npm run build
cd /opt/serverinv/server && sudo -u serverinv npx tsx src/db/migrate.ts
sudo systemctl start serverinv-serverinv
```

**Custom installation** (e.g., `serverinv-prod`):
```bash
# Set variables first
APP_USER="serverinv-prod"
APP_DIR="/opt/serverinv-prod"
SERVICE_NAME="serverinv-serverinv-prod"

# Then run the update commands
sudo systemctl stop ${SERVICE_NAME}
cd ${APP_DIR}
sudo -u ${APP_USER} git pull
sudo -u ${APP_USER} npm install
cd ${APP_DIR}/client && sudo -u ${APP_USER} npm run build
cd ${APP_DIR}/server && sudo -u ${APP_USER} npx tsx src/db/migrate.ts
sudo systemctl start ${SERVICE_NAME}
```

---

## Shared Hosting Updates

### Quick Reference: VirtualMin Rebuild

**Most common update scenario (server code only):**
```bash
cd ~/serverinv
git pull
cd server
npm run build
pm2 restart serverinv
```

**Check logs:**
```bash
pm2 logs serverinv --lines 50
```

For detailed instructions, see [VirtualMin-specific section](#control-panel-specific-restart-instructions) below.

---

### Prerequisites

Before updating, ensure your environment is ready:

**All Control Panels:**
```bash
# Verify Node.js version (must be 20+)
node --version

# Verify npm
npm --version
```

**DirectAdmin/VirtualMin (using systemd services):**
```bash
# Also verify tsx is installed (required for migrations)
tsx --version

# If tsx is missing:
npm install -g tsx
```

**VirtualMin-specific: Ensure nvm is loaded**
```bash
# Load nvm if commands not found
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Set Node.js version
nvm use 20
```

### Quick Update

SSH into your shared hosting account and run:

```bash
cd ~/serverinv  # or your installation directory
bash deploy/update-shared.sh  # if available, otherwise use manual steps
```

### Manual Update

```bash
cd ~/serverinv

# Clean build artifacts first
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Pull latest code
git pull

# If git pull fails with conflicts, stash local changes first:
# git stash push -m "Manual stash $(date +%Y-%m-%d_%H:%M:%S)"
# git pull
# git stash pop  # (optional, to restore local changes)

# Install dependencies
npm install

# Rebuild frontend
cd client
npm run build

# Run migrations
cd ../server
npx tsx src/db/migrate.ts

# Restart the application
# Method depends on your hosting control panel:
# - cPanel: Restart Node.js app in Application Manager
# - DirectAdmin: systemctl --user restart serverinv
# - VirtualMin: systemctl --user restart serverinv
# - Passenger: touch tmp/restart.txt
```

### Control Panel-Specific Restart Instructions

**cPanel:**
1. Log into cPanel
2. Go to "Setup Node.js App"
3. Find `serverinv` application
4. Click "Restart" or "Stop" then "Start"

**DirectAdmin:**
```bash
# If using systemd user service (recommended)
systemctl --user restart serverinv

# Check status
systemctl --user status serverinv
```

**VirtualMin GPL:**

*Quick rebuild (most common):*
```bash
cd ~/serverinv
git pull
cd server
npm run build
pm2 restart serverinv
```

*Full rebuild with client updates:*
```bash
cd ~/serverinv
git pull

# Install dependencies (if package.json changed)
npm install

# Rebuild server
cd server
npm run build

# Rebuild client (if frontend changed)
cd ../client
npm run build

# Sync to public_html (if using copy method instead of symlink)
~/serverinv/scripts/sync-client.sh

# Restart application
pm2 restart serverinv

# Verify and check logs
pm2 status serverinv
pm2 logs serverinv --lines 50 --nostream
```

*Alternative management script:*
```bash
~/serverinv/scripts/restart.sh
```

**Note for VirtualMin:** If you copied client files to `~/public_html` during setup (instead of using symlink), you MUST run the sync script after rebuilding the client, or changes won't appear.

---

## Configuration Updates

### Resetting Admin Credentials

If you've lost access to your admin account or need to update credentials:

**Option 1: During update**

The update script will prompt you to create/update admin credentials.

**Option 2: Standalone script (VPS only)**

```bash
# For default installation
sudo bash /opt/serverinv/deploy/reset-admin.sh

# For custom installation
sudo bash /opt/serverinv-prod/deploy/reset-admin.sh serverinv-prod
```

**Option 3: Manual (all environments)**

```bash
# VPS default installation
cd /opt/serverinv/server
npx tsx src/db/reset-admin.ts <username> <password>

# VPS custom installation
cd /opt/serverinv-prod/server
npx tsx src/db/reset-admin.ts <username> <password>

# Shared hosting
cd ~/serverinv/server
npx tsx src/db/reset-admin.ts <username> <password>
```

All methods will:
- Create a new admin user if the username doesn't exist
- Update the password and ensure admin role if the username already exists
- Work with both PostgreSQL and MySQL databases

### Updating Application URL (APP_URL)

If password reset email links are pointing to the wrong URL (e.g., localhost instead of your domain):

**Option 1: During update (VPS)**

The update script will prompt you to update APP_URL and automatically set ALLOWED_ORIGINS.

**Option 2: Manual edit (all environments)**

Edit your `.env` file:

```bash
# VPS
sudo nano /opt/serverinv/server/.env

# Shared hosting
nano ~/serverinv/server/.env
```

Set the APP_URL to your actual domain:

```bash
APP_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,http://your-domain.com
```

Then restart:

```bash
# VPS
sudo systemctl restart serverinv

# Shared hosting - restart via control panel
```

### Updating SMTP Settings

If email functionality isn't working or needs reconfiguration:

**Option 1: During update (VPS)**

The update script will prompt you to update SMTP settings.

**Option 2: Manual edit (all environments)**

Edit your `.env` file and add/update:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com
```

**Gmail users:** You need an [app-specific password](https://support.google.com/accounts/answer/185833), not your regular Gmail password.

Then restart the application.

---

## Post-Update Checklist

After updating, verify everything works:

- [ ] Application loads in browser
- [ ] Can log in with existing credentials
- [ ] Test CRUD operations (create, read, update, delete servers)
- [ ] Check logs for errors
- [ ] Test password reset email (if SMTP configured)
- [ ] Verify backup/restore functionality

### Checking Logs

**VPS (default installation):**
```bash
sudo journalctl -u serverinv-serverinv -n 50 --no-pager
```

**VPS (custom installation):**
```bash
# Replace 'serverinv-prod' with your installation username
sudo journalctl -u serverinv-serverinv-prod -n 50 --no-pager
```

**Shared hosting (cPanel):**
```bash
# Check Node.js app logs in cPanel control panel:
# - Go to "Setup Node.js App"
# - Click on your app
# - View error logs
```

**Shared hosting (DirectAdmin with systemd):**
```bash
# View systemd user service logs
journalctl --user -u serverinv -n 50

# Follow logs in real-time
journalctl --user -u serverinv -f
```

**Shared hosting (VirtualMin with PM2):**
```bash
# View PM2 logs
pm2 logs serverinv --lines 50

# Follow logs in real-time
pm2 logs serverinv

# View only error logs
pm2 logs serverinv --err

# View log files directly
tail -f ~/.pm2/logs/serverinv-out.log
tail -f ~/.pm2/logs/serverinv-error.log
```

---

## Rollback

If an update causes issues and you need to rollback:

### VPS Rollback

```bash
cd /opt/serverinv

# Rollback to previous commit
sudo -u serverinv git log --oneline -10  # Find the commit hash
sudo -u serverinv git reset --hard <previous-commit-hash>

# Rebuild
cd client
sudo -u serverinv npm run build

# Restart
sudo systemctl restart serverinv
```

### Shared Hosting Rollback

Same as VPS, but without `sudo` and use your installation directory:

```bash
cd ~/serverinv
git reset --hard <previous-commit-hash>
cd client && npm run build
# Restart via control panel
```

### Restore from Backup

If git rollback isn't sufficient:

1. Navigate to **Backup** page in the app
2. Click **Upload & Restore**
3. Select your pre-update backup file
4. Confirm restoration
5. Refresh the page

---

## Troubleshooting Updates

### Update script fails with permission errors

**VPS (default installation):**
```bash
sudo chown -R serverinv:serverinv /opt/serverinv
```

**VPS (custom installation):**
```bash
# Replace with your installation username
APP_USER="serverinv-prod"
sudo chown -R ${APP_USER}:${APP_USER} /opt/${APP_USER}
```

**Shared hosting:**
```bash
chmod -R 755 ~/serverinv
```

### Git pull fails with conflicts

**Note:** The automated update script (`deploy/update.sh`) now handles this automatically by cleaning build artifacts and stashing changes before pulling. This section is for manual updates or advanced troubleshooting.

If `git pull` fails because of local modifications or conflicts during manual updates:

**VPS:**
```bash
cd /opt/serverinv

# Clean build artifacts first
sudo -u serverinv find . -name "*.tsbuildinfo" -type f -delete

# Stash local changes
sudo -u serverinv git stash push -m "Manual stash $(date +%Y-%m-%d_%H:%M:%S)"

# Pull latest code
sudo -u serverinv git pull

# Optionally restore local changes (may cause conflicts)
sudo -u serverinv git stash pop

# Or discard local changes permanently:
# sudo -u serverinv git reset --hard origin/main
```

**Shared hosting:**
```bash
cd ~/serverinv

# Clean build artifacts first
find . -name "*.tsbuildinfo" -type f -delete

# Stash local changes
git stash push -m "Manual stash $(date +%Y-%m-%d_%H:%M:%S)"

# Pull latest code
git pull

# Optionally restore local changes
git stash pop

# Or discard local changes permanently:
# git reset --hard origin/main
```

**What this does:**
- `find ... -delete` - Removes TypeScript build artifacts that shouldn't be tracked
- `git stash push -m` - Temporarily saves your local changes with a descriptive message
- `git pull` - Updates from remote repository
- `git stash pop` - Attempts to reapply your local changes (may cause merge conflicts)
- `git reset --hard origin/main` - Discards all local changes permanently (use with caution)

**View stashed changes:**
```bash
git stash list  # Shows all stashed changes
git stash show  # Shows what's in the most recent stash
```

### Database migration fails

Check migration status:

```bash
cd /opt/serverinv/server  # or ~/serverinv/server
npx tsx src/db/migrate.ts
```

If migrations fail, restore from backup and try manual migration.

### Service won't start after update

Check what went wrong:

```bash
# VPS (default installation)
sudo journalctl -u serverinv-serverinv -n 100 --no-pager

# VPS (custom installation - replace with your username)
sudo journalctl -u serverinv-serverinv-prod -n 100 --no-pager

# Shared hosting (DirectAdmin/VirtualMin)
journalctl --user -u serverinv -n 100

# Shared hosting (cPanel)
# Check error logs in control panel > Setup Node.js App
```

Common issues:
- Missing dependencies: Run `npm install` again
- Environment variable missing: Check `.env` file
- Database connection failed: Verify `DATABASE_URL`
- Port conflict: Check if port 3000 is in use

### Frontend shows old version after update

Clear browser cache and rebuild:

```bash
cd /opt/serverinv/client  # or ~/serverinv/client
rm -rf dist/
npm run build
```

Then hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R).

### VirtualMin/PM2: Application won't start after update

**Error: PM2 shows app as "errored" or constantly restarting:**

```bash
# Check detailed error logs
pm2 logs serverinv --err --lines 100

# Delete and recreate the PM2 process
pm2 delete serverinv
cd ~/serverinv/server
pm2 start dist/index.js --name serverinv --env production

# Save PM2 configuration
pm2 save

# Check status
pm2 status serverinv
```

**Error: Port 3000 already in use:**

```bash
# Find what's using port 3000
netstat -tlnp | grep 3000

# Or with ss
ss -tlnp | grep 3000

# Kill old PM2 process if needed
pm2 delete serverinv

# Or change port in .env
nano ~/serverinv/server/.env
# Change PORT=3000 to PORT=3001 (or another available port)

# Restart
pm2 start dist/index.js --name serverinv --env production
```

### VirtualMin: tsx or TypeScript errors during update

**Error: `tsx: command not found` when running migrations:**

```bash
# Install tsx globally
npm install -g tsx

# If permission denied, configure npm prefix
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Install again
npm install -g tsx

# Verify
which tsx
tsx --version

# Run migrations again
cd ~/serverinv/server
npx tsx src/db/migrate.ts
```

**Error: Node.js version mismatch:**

```bash
# Check current version
node --version

# If version is < 20, update via nvm
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x

# Continue with update
```

**Error: TypeScript errors about missing @types packages:**

```bash
# Example error: "Could not find a declaration file for module 'express'"
# Cause: devDependencies not installed before building

cd ~/serverinv/server

# Install all dependencies (including devDependencies)
npm install

# Build the server
npm run build

# Optionally clean up devDependencies
npm prune --production

# Restart
systemctl --user restart serverinv  # DirectAdmin/VirtualMin
# Or restart via cPanel control panel
```

**Error: `Cannot find module` during update:**

```bash
# Clean install dependencies
cd ~/serverinv
rm -rf node_modules package-lock.json
npm install

cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install

# Rebuild
cd ~/serverinv/client
npm run build

# Run migrations
cd ~/serverinv/server
npx tsx src/db/migrate.ts

# Restart service
systemctl --user restart serverinv
```

---

## Version-Specific Update Notes

### Updating from v1.0.x to v1.1.x

Changes:
- Added password reset functionality (requires SMTP configuration)
- Added email field to users table (migration included)
- New environment variables: `APP_URL`, `SMTP_*`

After updating:
1. Run the update script to configure APP_URL and SMTP
2. Add email addresses to existing user accounts (Users page)
3. Test password reset functionality

---

## Support

If you encounter issues during updates:

1. Check the [Troubleshooting](#troubleshooting-updates) section above
2. Review the [main Deployment Guide](./deployment-guide.md) troubleshooting section
3. Check application logs for specific error messages
4. Restore from backup if necessary
5. Report issues on GitHub with logs and error messages

---

Last Updated: 2026-04-01
