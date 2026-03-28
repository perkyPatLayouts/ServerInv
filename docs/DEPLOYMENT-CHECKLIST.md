# ServerInv Deployment Checklist

Use this checklist when deploying ServerInv to production.

## Pre-Deployment

### Server Requirements
- [ ] VPS with Ubuntu 24.04 or Debian 12
- [ ] At least 1 GB RAM, 10 GB disk space
- [ ] Root or sudo access
- [ ] Domain name pointed to server IP (for SSL)
- [ ] SSH access configured

### Local Preparation
- [ ] All code committed to Git
- [ ] All tests passing locally
- [ ] Database migrations generated (`npm run db:generate`)
- [ ] Documentation reviewed and updated

## Initial Deployment

### 1. Upload Code to Server
```bash
# Option A: Clone from Git
git clone <your-repo-url> /tmp/serverinv

# Option B: Upload via SCP
scp -r /path/to/serverinv user@server:/tmp/serverinv
```

### 2. Run Automated Setup
```bash
ssh user@server
cd /tmp/serverinv
sudo bash deploy/setup.sh
```

The script will prompt you for:
- [ ] Domain name
- [ ] Web server choice (Nginx or Apache)
- [ ] Database type (PostgreSQL or MySQL)

### 3. Save Generated Credentials
The setup script will display:
- [ ] Database type selected - **NOTE THIS**
- [ ] Database password - **SAVE THIS**
- [ ] JWT secret - **SAVE THIS**
- [ ] Application URL

**Store these securely!** You'll need them for backups and troubleshooting.

### 4. Verify Installation
- [ ] Open the application URL in browser
- [ ] SSL certificate is active (https://)
- [ ] Login page appears
- [ ] Login with `admin` / `admin` succeeds

### 5. Initial Configuration
- [ ] Change admin password immediately
- [ ] Create additional user accounts (editors/viewers)
- [ ] Test role permissions (admin/editor/viewer)
- [ ] Add your first server to inventory
- [ ] Verify all CRUD operations work

### 6. Security Configuration
- [ ] Confirm `ALLOWED_ORIGINS` in `.env` matches your domain
- [ ] Verify CORS is working (no errors in browser console)
- [ ] Test authentication expiration (24 hours)
- [ ] Confirm backup/restore is admin-only
- [ ] Test SSL auto-renewal setup: `sudo certbot renew --dry-run`

## Post-Deployment

### Monitoring Setup
- [ ] Set up server monitoring (uptime, disk space)
- [ ] Configure log rotation for systemd journal
- [ ] Test systemd auto-restart: `sudo systemctl restart serverinv`
- [ ] Verify app starts after server reboot

### Backup Strategy
- [ ] Test manual backup download from UI
- [ ] Test backup restore from UI
- [ ] Set up automated backups (cron + pg_dump)
- [ ] Configure offsite backup storage
- [ ] Document backup retention policy
- [ ] Test restore procedure

### Firewall Configuration
If using UFW:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### Performance Tuning (Optional)
- [ ] Configure PostgreSQL shared_buffers for your RAM
- [ ] Enable gzip compression in nginx
- [ ] Set up database connection pooling limits
- [ ] Configure log levels for production

## Updating the Application

### Before Update
- [ ] Download full database backup
- [ ] Verify backup integrity (test restore locally)
- [ ] Review CHANGELOG for breaking changes
- [ ] Notify users of upcoming downtime (if needed)

### Update Process
```bash
ssh user@server
cd /opt/serverinv
sudo bash deploy/update.sh
```

The update script will:
1. Stop the ServerInv service
2. Pull the latest code
3. Install dependencies
4. Rebuild the frontend
5. Run database migrations
6. **Optionally prompt to create/update admin credentials** (useful if login was lost)
7. Restart the service

### After Update
- [ ] Verify service is running: `sudo systemctl status serverinv`
- [ ] Test login (or reset admin credentials if lost access)
- [ ] Verify all pages load correctly
- [ ] Check for errors: `sudo journalctl -u serverinv -n 50`
- [ ] Test CRUD operations
- [ ] Notify users that update is complete

### Resetting Admin Credentials

If you've lost admin access after an update:

**VPS/Dedicated Server:**
```bash
sudo bash /opt/serverinv/deploy/reset-admin.sh
```

**Manual:**
```bash
cd /opt/serverinv/server
sudo -u serverinv npx tsx src/db/reset-admin.ts admin NewPassword123
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
sudo journalctl -u serverinv -n 100 --no-pager

# Verify .env file exists and is correct
cat /opt/serverinv/server/.env

# Test database connection
# PostgreSQL:
sudo -u serverinv psql "$DATABASE_URL" -c "SELECT 1;"
# MySQL:
# mysql -u serverinv -p serverinv -e "SELECT 1;"

# Check file permissions
sudo chown -R serverinv:serverinv /opt/serverinv
```

### nginx Returns 502 Bad Gateway
```bash
# Verify backend is running
sudo systemctl status serverinv

# Test backend directly
curl http://127.0.0.1:3000/api/auth/login
```

### Frontend Shows Blank Page
```bash
# Rebuild frontend
cd /opt/serverinv/client
sudo -u serverinv npm run build

# Verify dist folder exists
ls -la /opt/serverinv/client/dist/
```

## Security Incidents

If you suspect a security breach:
1. [ ] Change all user passwords immediately (use reset-admin.sh for admin account)
2. [ ] Generate new JWT_SECRET (invalidates all sessions)
3. [ ] Review logs for suspicious activity
4. [ ] Check database for unauthorized changes
5. [ ] Restore from backup if necessary
6. [ ] Document incident and response actions
7. [ ] Update security measures to prevent recurrence

### Emergency Admin Password Reset
```bash
# VPS/Dedicated:
sudo bash /opt/serverinv/deploy/reset-admin.sh

# Or manual:
cd /opt/serverinv/server
sudo -u serverinv npx tsx src/db/reset-admin.ts admin NewSecurePassword
```

## Maintenance Schedule

### Daily
- Monitor application uptime
- Check for error logs

### Weekly
- Review user activity logs
- Verify backup completion
- Check disk space usage

### Monthly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review security advisories
- Test backup restore procedure
- Update Node.js if security updates available
- Run `npm audit` and apply fixes

### Quarterly
- Review and update user accounts
- Audit user permissions
- Review and archive old backups
- Performance review and optimization
- Security audit and penetration testing

## Contacts

| Role | Contact | Notes |
|------|---------|-------|
| System Administrator | | Primary contact for server access |
| Application Administrator | | Manages user accounts and backups |
| Database Administrator | | Handles database performance and backups |
| Security Contact | | Reports security vulnerabilities |

---

**Last Updated:** 2026-03-26
**Document Version:** 1.0
