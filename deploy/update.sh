#!/usr/bin/env bash
set -euo pipefail

# ServerInv update script
# Run on the remote server as root or with sudo
# Usage: sudo bash update.sh

APP_DIR="/opt/serverinv"
APP_USER="serverinv"

if [ ! -d "$APP_DIR" ]; then
  echo "Error: $APP_DIR does not exist. Is ServerInv installed?"
  exit 1
fi

echo "==> Stopping ServerInv service"
systemctl stop serverinv

echo "==> Pulling latest code"
cd "$APP_DIR"
sudo -u "$APP_USER" git pull

echo "==> Installing dependencies"
sudo -u "$APP_USER" npm install

echo "==> Building frontend"
cd "$APP_DIR/client"
sudo -u "$APP_USER" npm run build

echo "==> Running database migrations"
cd "$APP_DIR/server"
sudo -u "$APP_USER" npx tsx src/db/migrate.ts

# Optional: Reset admin credentials
echo ""
echo "==> Admin Credentials Management"
read -p "Do you want to create/update admin login credentials? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Enter admin username: " admin_username
  if [ -z "$admin_username" ]; then
    echo "Error: Username cannot be empty. Skipping admin reset."
  else
    read -sp "Enter admin password: " admin_password
    echo
    if [ -z "$admin_password" ]; then
      echo "Error: Password cannot be empty. Skipping admin reset."
    elif [ ${#admin_password} -lt 4 ]; then
      echo "Error: Password must be at least 4 characters. Skipping admin reset."
    else
      echo "Creating/updating admin user..."
      sudo -u "$APP_USER" npx tsx src/db/reset-admin.ts "$admin_username" "$admin_password"
    fi
  fi
fi

# Optional: Update ALLOWED_ORIGINS
echo ""
echo "==> CORS Configuration"
read -p "Do you want to update ALLOWED_ORIGINS? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Current ALLOWED_ORIGINS in .env:"
  grep ALLOWED_ORIGINS "$APP_DIR/server/.env" || echo "  (not found)"
  echo ""
  echo "Enter new allowed origins (comma-separated, no spaces)."
  echo "Examples:"
  echo "  - https://example.com,http://example.com"
  echo "  - https://app.example.com,https://www.example.com,http://example.com"
  echo ""
  read -p "New ALLOWED_ORIGINS: " new_origins
  if [ -n "$new_origins" ]; then
    # Update or add ALLOWED_ORIGINS in .env file
    if grep -q "ALLOWED_ORIGINS=" "$APP_DIR/server/.env"; then
      # Update existing
      sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$new_origins|" "$APP_DIR/server/.env"
      echo "✓ Updated ALLOWED_ORIGINS in $APP_DIR/server/.env"
    else
      # Add new
      echo "ALLOWED_ORIGINS=$new_origins" >> "$APP_DIR/server/.env"
      echo "✓ Added ALLOWED_ORIGINS to $APP_DIR/server/.env"
    fi

    # Also update root .env if it exists
    if [ -f "$APP_DIR/.env" ]; then
      if grep -q "ALLOWED_ORIGINS=" "$APP_DIR/.env"; then
        sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$new_origins|" "$APP_DIR/.env"
      else
        echo "ALLOWED_ORIGINS=$new_origins" >> "$APP_DIR/.env"
      fi
      echo "✓ Updated ALLOWED_ORIGINS in $APP_DIR/.env"
    fi
  else
    echo "No origins entered. Skipping ALLOWED_ORIGINS update."
  fi
fi

echo ""
echo "==> Restarting ServerInv service"
systemctl start serverinv

echo ""
echo "==> Update complete!"
echo "    Service status:"
systemctl status serverinv --no-pager -l
