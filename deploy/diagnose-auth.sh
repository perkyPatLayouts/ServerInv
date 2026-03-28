#!/usr/bin/env bash
# ServerInv Authentication Diagnostic Script
# Run this on your remote server to diagnose login issues

set -e

APP_DIR="/opt/serverinv"
APP_USER="serverinv"

echo "=================================="
echo "ServerInv Authentication Diagnostics"
echo "=================================="
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
  echo "❌ Error: $APP_DIR does not exist"
  exit 1
fi
echo "✓ App directory exists: $APP_DIR"

# Check .env file
if [ ! -f "$APP_DIR/server/.env" ]; then
  echo "❌ Error: .env file not found at $APP_DIR/server/.env"
  exit 1
fi
echo "✓ .env file exists"

# Show DATABASE_URL (mask password)
echo ""
echo "Database Configuration:"
DB_URL=$(grep DATABASE_URL "$APP_DIR/server/.env" || echo "NOT_FOUND")
if [ "$DB_URL" = "NOT_FOUND" ]; then
  echo "❌ DATABASE_URL not found in .env"
else
  # Mask password in output
  MASKED_URL=$(echo "$DB_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/user:****@/')
  echo "  $MASKED_URL"
fi

# Detect database type
if echo "$DB_URL" | grep -q "postgres://"; then
  DB_TYPE="postgres"
  echo "  Type: PostgreSQL"
elif echo "$DB_URL" | grep -q "mysql://"; then
  DB_TYPE="mysql"
  echo "  Type: MySQL"
else
  echo "❌ Unknown database type"
  exit 1
fi

# Check service status
echo ""
echo "Service Status:"
if systemctl is-active --quiet serverinv; then
  echo "✓ serverinv service is running"
else
  echo "❌ serverinv service is NOT running"
  echo "  Try: sudo systemctl start serverinv"
fi

# Check backend is responding
echo ""
echo "Backend Connectivity:"
if curl -s http://localhost:3000/api/auth/login -o /dev/null -w "%{http_code}" | grep -q "400"; then
  echo "✓ Backend is responding on port 3000"
else
  echo "❌ Backend is not responding on port 3000"
  echo "  Check logs: sudo journalctl -u serverinv -n 50"
fi

# Check users in database
echo ""
echo "Database Users:"
if [ "$DB_TYPE" = "postgres" ]; then
  sudo -u postgres psql -d serverinv -c "SELECT id, username, role, LENGTH(password) as pwd_hash_len, created_at FROM users ORDER BY id;" 2>/dev/null || echo "❌ Could not query database"
else
  sudo mysql serverinv -e "SELECT id, username, role, LENGTH(password) as pwd_hash_len, created_at FROM users ORDER BY id;" 2>/dev/null || echo "❌ Could not query database"
fi

echo ""
echo "=================================="
echo "Notes:"
echo "- Password hash length should be 60 characters (bcrypt)"
echo "- If hash length is different, password was not hashed correctly"
echo "- To reset admin password, run:"
echo "  cd $APP_DIR/server"
echo "  sudo -u $APP_USER npx tsx src/db/reset-admin.ts admin YourNewPassword"
echo "=================================="
