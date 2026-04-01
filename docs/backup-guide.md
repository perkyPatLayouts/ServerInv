# ServerInv Backup Guide

This guide covers automated and manual backup strategies for ServerInv, including cron-based scheduling, offsite backups, and disaster recovery procedures.

## Table of Contents

- [Backup Methods Overview](#backup-methods-overview)
- [Manual Backups (Browser-Based)](#manual-backups-browser-based)
- [Automated Backups with Cron](#automated-backups-with-cron)
- [Backup Rotation & Retention](#backup-rotation--retention)
- [Offsite & Remote Backups](#offsite--remote-backups)
- [Backup Verification](#backup-verification)
- [Restoration Procedures](#restoration-procedures)
- [Troubleshooting](#troubleshooting)

---

## Backup Methods Overview

ServerInv supports multiple backup approaches:

| Method | Best For | Pros | Cons |
|--------|----------|------|------|
| **Browser-based** | Manual backups, one-time exports | Easy, no shell access needed | Manual process |
| **Native tools** (pg_dump/mysqldump) | VPS with shell access | Fast, reliable, standard format | Requires shell access |
| **API-based** | Automated scripts, shared hosting | Works anywhere, scriptable | Requires auth token |
| **Pure Node.js** | Shared hosting without shell tools | No external dependencies | Slower for large databases |

---

## Manual Backups (Browser-Based)

### Creating a Manual Backup

1. Log into ServerInv as an admin user
2. Navigate to **Backup & Restore** in the sidebar
3. Click **Download Backup**
4. Save the `.sql` file to your computer
5. Store in a secure location (encrypted drive, cloud storage)

### Backup Options

- **Full backup** - Includes all data and user accounts
- **Exclude users** - Backs up data without user credentials (useful for sharing/testing)

**See the [Deployment Guide](./deployment-guide.md#backup--restore-features) for detailed restore options.**

---

## Automated Backups with Cron

Automated backups run on a schedule without manual intervention. This section covers VPS/dedicated server scenarios where you have shell access.

### Prerequisites

- Root or sudo access
- Shell access to the server
- Sufficient disk space for backups
- `crontab` installed (standard on Ubuntu/Debian)

### Backup Methods

#### Method 1: Native Database Tools (Recommended for VPS)

**PostgreSQL Example:**

```bash
# Edit the serverinv user's crontab
sudo -u serverinv crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
```

**MySQL Example:**

```bash
# Edit the serverinv user's crontab
sudo -u serverinv crontab -e

# Add daily backup at 2 AM
0 2 * * * mysqldump --defaults-extra-file=/home/serverinv/.my.cnf serverinv > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
```

**MySQL Credentials File** (`/home/serverinv/.my.cnf`):
```ini
[client]
user=serverinv
password=your_database_password
host=localhost
```

**Secure the credentials file:**
```bash
chmod 600 /home/serverinv/.my.cnf
chown serverinv:serverinv /home/serverinv/.my.cnf
```

#### Method 2: API-Based Backup (Works on VPS and Shared Hosting)

**Prerequisites:**
1. Generate an admin API token (log in and copy from browser's localStorage: `auth-storage`)
2. Extract the token value from the stored JSON

**Cron Example:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM using API
0 2 * * * curl -H "Authorization: Bearer YOUR_TOKEN_HERE" https://your-domain.com/api/backup/download -o /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
```

**Exclude users from API backup:**
```bash
0 2 * * * curl -H "Authorization: Bearer YOUR_TOKEN_HERE" "https://your-domain.com/api/backup/download?excludeUsers=true" -o /home/serverinv/backups/serverinv-data-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
```

### Cron Schedule Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Daily at 2 AM | `0 2 * * *` | Most common for production |
| Every 6 hours | `0 */6 * * *` | High-frequency for critical data |
| Weekly (Sunday 3 AM) | `0 3 * * 0` | Low-frequency for stable systems |
| Every 12 hours | `0 */12 * * *` | Moderate frequency |
| Daily at 2:30 AM | `30 2 * * *` | Offset to avoid system maintenance windows |

**Pro Tip:** Stagger backup times if running multiple services to avoid resource contention.

### Setting Up the Backup Directory

**For VPS installations:**

```bash
# Create backup directory
sudo mkdir -p /home/serverinv/backups

# Set ownership
sudo chown serverinv:serverinv /home/serverinv/backups

# Set permissions
sudo chmod 700 /home/serverinv/backups

# Verify
ls -la /home/serverinv/
```

**For custom installations** (e.g., `serverinv-prod`):

```bash
# Replace 'serverinv-prod' with your installation name
sudo mkdir -p /home/serverinv-prod/backups
sudo chown serverinv-prod:serverinv-prod /home/serverinv-prod/backups
sudo chmod 700 /home/serverinv-prod/backups
```

---

## Backup Rotation & Retention

Automated backups can quickly fill disk space. Implement rotation to keep only recent backups.

### Rotation Strategy Examples

#### Keep Last 7 Days

**Add to crontab after backup line:**

```bash
# PostgreSQL backup with 7-day rotation
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
5 2 * * * find /home/serverinv/backups -name "serverinv-*.sql" -type f -mtime +7 -delete
```

**Explanation:**
- First job (2:00 AM): Creates backup
- Second job (2:05 AM): Deletes backups older than 7 days
- `-mtime +7`: Files modified more than 7 days ago

#### Keep Last 30 Days + Weekly Archives

**Script-based approach** (`/home/serverinv/scripts/backup-with-rotation.sh`):

```bash
#!/bin/bash
# ServerInv backup with rotation script

BACKUP_DIR="/home/serverinv/backups"
DATE=$(date +%Y%m%d)
DAILY_BACKUP="$BACKUP_DIR/daily/serverinv-$DATE.sql"
WEEKLY_BACKUP="$BACKUP_DIR/weekly/serverinv-$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Create directories
mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"

# Extract DATABASE_URL
DB_URL=$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)

# Create daily backup
echo "[$(date)] Starting daily backup..." >> "$LOG_FILE"
pg_dump "$DB_URL" > "$DAILY_BACKUP" 2>> "$LOG_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date)] Daily backup completed: $DAILY_BACKUP" >> "$LOG_FILE"

  # Create weekly backup on Sundays
  if [ $(date +%u) -eq 7 ]; then
    cp "$DAILY_BACKUP" "$WEEKLY_BACKUP"
    echo "[$(date)] Weekly backup created: $WEEKLY_BACKUP" >> "$LOG_FILE"
  fi

  # Delete daily backups older than 30 days
  find "$BACKUP_DIR/daily" -name "serverinv-*.sql" -type f -mtime +30 -delete

  # Delete weekly backups older than 90 days
  find "$BACKUP_DIR/weekly" -name "serverinv-*.sql" -type f -mtime +90 -delete

  echo "[$(date)] Rotation complete" >> "$LOG_FILE"
else
  echo "[$(date)] ERROR: Backup failed" >> "$LOG_FILE"
fi
```

**Make executable and add to cron:**

```bash
chmod +x /home/serverinv/scripts/backup-with-rotation.sh
chown serverinv:serverinv /home/serverinv/scripts/backup-with-rotation.sh

# Add to crontab
sudo -u serverinv crontab -e

# Run daily at 2 AM
0 2 * * * /home/serverinv/scripts/backup-with-rotation.sh
```

**Retention policy:**
- Daily backups: 30 days
- Weekly backups: 90 days

#### Grandfather-Father-Son (GFS) Rotation

Complex rotation strategy for compliance/long-term retention:

- **Daily** (Son): Keep 7 days
- **Weekly** (Father): Keep 4 weeks
- **Monthly** (Grandfather): Keep 12 months

**Implementation:** See advanced backup scripts in `docs/examples/gfs-backup.sh` (create if needed).

---

## Offsite & Remote Backups

Storing backups on the same server is insufficient for disaster recovery. Always maintain offsite copies.

### Method 1: SCP to Remote Server

**Cron example:**

```bash
# Backup locally then copy to remote server
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
10 2 * * * scp /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql backup-user@backup-server.com:/backups/serverinv/ 2>> /home/serverinv/backups/backup.log
```

**Set up SSH key authentication:**

```bash
# Generate SSH key (if not exists)
sudo -u serverinv ssh-keygen -t ed25519 -f /home/serverinv/.ssh/id_ed25519 -N ""

# Copy public key to backup server
sudo -u serverinv ssh-copy-id backup-user@backup-server.com

# Test connection
sudo -u serverinv ssh backup-user@backup-server.com "echo 'Connection successful'"
```

### Method 2: Rsync to Remote Server

**More efficient for large backups:**

```bash
# Sync entire backup directory to remote server
15 2 * * * rsync -avz --delete /home/serverinv/backups/ backup-user@backup-server.com:/backups/serverinv/ 2>> /home/serverinv/backups/backup.log
```

**Advantages:**
- Only transfers changed files
- Can sync entire directory structure
- `--delete` removes old files on remote (use carefully)

### Method 3: Cloud Storage (AWS S3, Backblaze B2, etc.)

**AWS S3 example:**

```bash
# Install AWS CLI
sudo apt-get install awscli

# Configure credentials (run as serverinv user)
sudo -u serverinv aws configure

# Add to crontab
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" | gzip | aws s3 cp - s3://your-bucket/serverinv/serverinv-$(date +\%Y\%m\%d).sql.gz 2>> /home/serverinv/backups/backup.log
```

**Backblaze B2 example:**

```bash
# Install B2 CLI
sudo pip3 install b2

# Authorize (run once as serverinv user)
sudo -u serverinv b2 authorize-account <application_key_id> <application_key>

# Add to crontab
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" | gzip > /tmp/serverinv-$(date +\%Y\%m\%d).sql.gz && b2 upload-file your-bucket-name /tmp/serverinv-$(date +\%Y\%m\%d).sql.gz serverinv/serverinv-$(date +\%Y\%m\%d).sql.gz 2>> /home/serverinv/backups/backup.log && rm /tmp/serverinv-$(date +\%Y\%m\%d).sql.gz
```

### Method 4: Email Backup Attachments

**For small databases only:**

```bash
# Install mail utility if not present
sudo apt-get install mailutils

# Create backup and email it
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" | gzip > /tmp/serverinv-$(date +\%Y\%m\%d).sql.gz && echo "ServerInv backup attached" | mail -s "ServerInv Backup $(date +\%Y-\%m-\%d)" -A /tmp/serverinv-$(date +\%Y\%m\%d).sql.gz your-email@example.com && rm /tmp/serverinv-$(date +\%Y\%m\%d).sql.gz
```

**Warning:** Most email providers limit attachment sizes (typically 25MB). Only suitable for very small databases.

---

## Backup Verification

Automated backups are only useful if they can be restored. Regularly verify backup integrity.

### Manual Verification

**PostgreSQL:**

```bash
# Test backup integrity (doesn't restore, just validates SQL)
psql -U serverinv -d postgres -f /home/serverinv/backups/serverinv-20260401.sql --set ON_ERROR_STOP=on -o /dev/null

# Check exit code
echo $?  # 0 = success, non-zero = errors
```

**MySQL:**

```bash
# Test backup integrity
mysql -u serverinv -p serverinv_test < /home/serverinv/backups/serverinv-20260401.sql

# Check exit code
echo $?  # 0 = success, non-zero = errors

# Clean up test database
mysql -u serverinv -p -e "DROP DATABASE IF EXISTS serverinv_test;"
```

### Automated Verification Script

**Add to crontab to verify weekly:**

```bash
# Verify last Sunday's backup every Monday at 3 AM
0 3 * * 1 /home/serverinv/scripts/verify-backup.sh
```

**Verification script** (`/home/serverinv/scripts/verify-backup.sh`):

```bash
#!/bin/bash
# Verify most recent backup

BACKUP_DIR="/home/serverinv/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/serverinv-*.sql 2>/dev/null | head -1)
LOG_FILE="$BACKUP_DIR/verification.log"

if [ -z "$LATEST_BACKUP" ]; then
  echo "[$(date)] ERROR: No backups found in $BACKUP_DIR" >> "$LOG_FILE"
  exit 1
fi

echo "[$(date)] Verifying backup: $LATEST_BACKUP" >> "$LOG_FILE"

# Test PostgreSQL backup (adjust for MySQL if needed)
psql -U serverinv -d postgres -f "$LATEST_BACKUP" --set ON_ERROR_STOP=on -o /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date)] SUCCESS: Backup verified" >> "$LOG_FILE"
  exit 0
else
  echo "[$(date)] ERROR: Backup verification failed" >> "$LOG_FILE"
  # Optionally send alert email
  echo "Backup verification failed for $LATEST_BACKUP" | mail -s "ServerInv Backup Verification Failed" admin@example.com
  exit 1
fi
```

### Check Backup File Size

**Monitor for suspiciously small backups:**

```bash
# Alert if backup is smaller than 1MB (adjust threshold as needed)
0 3 * * * LATEST=$(ls -t /home/serverinv/backups/serverinv-*.sql 2>/dev/null | head -1); SIZE=$(stat -f%z "$LATEST" 2>/dev/null || stat -c%s "$LATEST" 2>/dev/null); if [ "$SIZE" -lt 1048576 ]; then echo "Backup file $LATEST is suspiciously small: $SIZE bytes" | mail -s "ServerInv Backup Size Alert" admin@example.com; fi
```

---

## Restoration Procedures

### From Browser-Based Backup

See [Deployment Guide - Backup & Restore](./deployment-guide.md#backup--restore-features) for detailed instructions.

**Quick steps:**
1. Navigate to **Backup & Restore** page
2. Click **Upload & Restore**
3. Select your `.sql` backup file
4. Choose restore options (clean vs merge, exclude users, etc.)
5. Confirm and wait for completion

### From Command Line (PostgreSQL)

**Full database restore:**

```bash
# Stop the application
sudo systemctl stop serverinv-serverinv

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS serverinv;"
sudo -u postgres psql -c "CREATE DATABASE serverinv OWNER serverinv;"

# Restore from backup
sudo -u serverinv psql serverinv < /home/serverinv/backups/serverinv-20260401.sql

# Restart application
sudo systemctl start serverinv-serverinv
```

**Restore to a different database (for testing):**

```bash
# Create test database
sudo -u postgres psql -c "CREATE DATABASE serverinv_test OWNER serverinv;"

# Restore
sudo -u serverinv psql serverinv_test < /home/serverinv/backups/serverinv-20260401.sql

# Access test database
psql -U serverinv -d serverinv_test
```

### From Command Line (MySQL)

**Full database restore:**

```bash
# Stop the application
sudo systemctl stop serverinv-serverinv

# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS serverinv;"
mysql -u root -p -e "CREATE DATABASE serverinv;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON serverinv.* TO 'serverinv'@'localhost';"

# Restore from backup
mysql -u serverinv -p serverinv < /home/serverinv/backups/serverinv-20260401.sql

# Restart application
sudo systemctl start serverinv-serverinv
```

### Disaster Recovery Procedure

**Complete server failure requiring restoration to new server:**

1. **Deploy ServerInv** on new server:
   ```bash
   # Follow deployment guide to set up fresh installation
   sudo bash deploy/setup.sh
   ```

2. **Stop the service:**
   ```bash
   sudo systemctl stop serverinv-serverinv
   ```

3. **Transfer backup** to new server:
   ```bash
   # From your local machine or backup server
   scp /path/to/serverinv-backup.sql root@new-server:/tmp/
   ```

4. **Restore database:**
   ```bash
   # PostgreSQL
   sudo -u serverinv psql serverinv < /tmp/serverinv-backup.sql

   # MySQL
   mysql -u serverinv -p serverinv < /tmp/serverinv-backup.sql
   ```

5. **Verify and start:**
   ```bash
   # Check database
   sudo -u serverinv psql serverinv -c "SELECT COUNT(*) FROM servers;"

   # Start application
   sudo systemctl start serverinv-serverinv

   # Check status
   sudo systemctl status serverinv-serverinv
   ```

6. **Test login** and verify data integrity through the web interface.

---

## Troubleshooting

### Cron Job Not Running

**Check if cron daemon is running:**
```bash
sudo systemctl status cron
```

**View cron logs:**
```bash
# Ubuntu/Debian
sudo grep CRON /var/log/syslog | tail -20

# Or check user-specific cron logs
sudo journalctl -u cron | tail -20
```

**Test cron environment:**
```bash
# Add test job to output environment
* * * * * env > /tmp/cron-env.txt

# Wait a minute, then check
cat /tmp/cron-env.txt
```

**Common issue:** Cron has limited environment variables. Always use absolute paths and consider sourcing environment:
```bash
0 2 * * * bash -c 'source /opt/serverinv/server/.env && pg_dump "$DATABASE_URL" > /home/serverinv/backups/backup-$(date +\%Y\%m\%d).sql'
```

### Backup File is Empty or Very Small

**Check cron logs:**
```bash
cat /home/serverinv/backups/backup.log
```

**Test command manually:**
```bash
# Run the exact command from crontab
sudo -u serverinv pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /tmp/test-backup.sql

# Check file size
ls -lh /tmp/test-backup.sql
```

**Common issues:**
- Database credentials incorrect
- DATABASE_URL not accessible from cron environment
- Insufficient permissions on backup directory

### Backup Fails with Permission Denied

**Check backup directory permissions:**
```bash
ls -la /home/serverinv/backups
```

**Fix ownership:**
```bash
sudo chown -R serverinv:serverinv /home/serverinv/backups
sudo chmod 700 /home/serverinv/backups
```

### Restoration Fails with Errors

**Check error messages carefully:**
```bash
# Redirect errors to a file
psql -U serverinv serverinv < backup.sql 2> restore-errors.log
cat restore-errors.log
```

**Common issues:**
- Schema conflicts (old backup, new code): May need to run migrations after restore
- Duplicate key violations: Try restore with merge options via browser
- Database version mismatch: Ensure backup came from compatible database version

### MySQL: Access Denied Errors

**Verify credentials:**
```bash
mysql -u serverinv -p serverinv -e "SELECT 1;"
```

**Check grants:**
```bash
mysql -u root -p -e "SHOW GRANTS FOR 'serverinv'@'localhost';"
```

**Re-grant if needed:**
```bash
mysql -u root -p -e "GRANT ALL PRIVILEGES ON serverinv.* TO 'serverinv'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

---

## Best Practices Summary

1. **3-2-1 Rule**: 3 copies of data, on 2 different media, with 1 offsite
2. **Automate everything**: Manual backups are forgotten backups
3. **Test restores regularly**: Schedule monthly restore tests
4. **Monitor backup sizes**: Alert on unexpected size changes
5. **Secure backups**: Encrypt sensitive backups, restrict permissions (700)
6. **Document procedures**: Keep recovery procedures up to date
7. **Rotate backups**: Balance retention needs with disk space
8. **Verify integrity**: Automated verification catches corruption early
9. **Plan for disasters**: Practice full disaster recovery at least annually
10. **Monitor logs**: Review backup logs weekly for silent failures

---

## Quick Reference

**Daily PostgreSQL backup with 7-day retention:**
```bash
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
5 2 * * * find /home/serverinv/backups -name "serverinv-*.sql" -type f -mtime +7 -delete
```

**Daily MySQL backup with 7-day retention:**
```bash
0 2 * * * mysqldump --defaults-extra-file=/home/serverinv/.my.cnf serverinv > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
5 2 * * * find /home/serverinv/backups -name "serverinv-*.sql" -type f -mtime +7 -delete
```

**Daily backup with offsite copy:**
```bash
0 2 * * * pg_dump "$(grep DATABASE_URL /opt/serverinv/server/.env | cut -d= -f2-)" > /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql 2>> /home/serverinv/backups/backup.log
10 2 * * * scp /home/serverinv/backups/serverinv-$(date +\%Y\%m\%d).sql backup-user@remote-server:/backups/serverinv/ 2>> /home/serverinv/backups/backup.log
```

---

**Related Documentation:**
- [Deployment Guide - Backup & Restore Features](./deployment-guide.md#backup--restore-features)
- [Update Guide](./update-guide.md)
- [Security Guide](./SECURITY.md)

Last Updated: 2026-04-01
