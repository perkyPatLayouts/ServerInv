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
cd /opt/serverinv
sudo bash deploy/update.sh
```

The script will:
1. Stop the ServerInv service
2. Pull the latest code via `git pull`
3. Install any new dependencies
4. Rebuild the frontend
5. Run database migrations
6. **Optionally prompt to create/update admin credentials** (if login was lost)
7. **Optionally update ALLOWED_ORIGINS** (manual override only - normally auto-set from APP_URL)
8. **Optionally update APP_URL** (automatically updates ALLOWED_ORIGINS to both http and https)
9. **Optionally update SMTP settings** (for email functionality)
10. Restart the service and show status

**Note:** When you update APP_URL, ALLOWED_ORIGINS is automatically set to include both `http://domain` and `https://domain`. You only need to manually update ALLOWED_ORIGINS if you need additional domains beyond your main domain.

### Manual Update

If you prefer to update manually:

```bash
# Stop the service
sudo systemctl stop serverinv

cd /opt/serverinv

# Pull latest code (or upload new files)
sudo -u serverinv git pull

# If git pull fails with conflicts, stash local changes first:
# sudo -u serverinv git stash
# sudo -u serverinv git pull
# sudo -u serverinv git stash pop  # (optional, to restore local changes)

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
sudo systemctl status serverinv
```

---

## Shared Hosting Updates

### Quick Update

SSH into your shared hosting account and run:

```bash
cd ~/serverinv  # or your installation directory
bash deploy/update-shared.sh  # if available, otherwise use manual steps
```

### Manual Update

```bash
cd ~/serverinv

# Pull latest code
git pull

# If git pull fails with conflicts, stash local changes first:
# git stash
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
# - DirectAdmin: Restart via Custom HTTPD Configuration or terminal
# - Passenger: touch tmp/restart.txt
```

---

## Configuration Updates

### Resetting Admin Credentials

If you've lost access to your admin account or need to update credentials:

**Option 1: During update**

The update script will prompt you to create/update admin credentials.

**Option 2: Standalone script (VPS only)**

```bash
sudo bash /opt/serverinv/deploy/reset-admin.sh
```

**Option 3: Manual (all environments)**

```bash
cd /opt/serverinv/server  # or ~/serverinv/server on shared hosting
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

**VPS:**
```bash
sudo journalctl -u serverinv -n 50 --no-pager
```

**Shared hosting:**
```bash
# Check Node.js app logs in control panel
# Or check error logs:
tail -f ~/serverinv/server/logs/error.log  # if logging is configured
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

**VPS:**
```bash
sudo chown -R serverinv:serverinv /opt/serverinv
```

**Shared hosting:**
```bash
chmod -R 755 ~/serverinv
```

### Git pull fails with conflicts

If `git pull` fails because of local modifications or conflicts:

**VPS:**
```bash
cd /opt/serverinv

# Stash local changes
sudo -u serverinv git stash

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

# Stash local changes
git stash

# Pull latest code
git pull

# Optionally restore local changes
git stash pop

# Or discard local changes permanently:
# git reset --hard origin/main
```

**What this does:**
- `git stash` - Temporarily saves your local changes
- `git pull` - Updates from remote repository
- `git stash pop` - Attempts to reapply your local changes (may cause merge conflicts)
- `git reset --hard origin/main` - Discards all local changes permanently (use with caution)

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
# VPS
sudo journalctl -u serverinv -n 100 --no-pager

# Shared hosting
# Check error logs in control panel
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

Last Updated: 2025-03-28
