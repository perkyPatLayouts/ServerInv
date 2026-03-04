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

echo "==> Restarting ServerInv service"
systemctl start serverinv

echo ""
echo "==> Update complete!"
echo "    Service status:"
systemctl status serverinv --no-pager -l
