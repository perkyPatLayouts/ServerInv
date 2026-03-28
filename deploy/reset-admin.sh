#!/usr/bin/env bash
set -euo pipefail

# ServerInv admin credential reset script
# Run on the remote server as root or with sudo
# Usage: sudo bash reset-admin.sh

APP_DIR="/opt/serverinv"
APP_USER="serverinv"

if [ ! -d "$APP_DIR" ]; then
  echo "Error: $APP_DIR does not exist. Is ServerInv installed?"
  exit 1
fi

echo "==================================="
echo "ServerInv Admin Credential Reset"
echo "==================================="
echo ""

read -p "Enter admin username: " admin_username
if [ -z "$admin_username" ]; then
  echo "Error: Username cannot be empty."
  exit 1
fi

read -sp "Enter admin password: " admin_password
echo
if [ -z "$admin_password" ]; then
  echo "Error: Password cannot be empty."
  exit 1
fi

if [ ${#admin_password} -lt 4 ]; then
  echo "Error: Password must be at least 4 characters."
  exit 1
fi

echo ""
echo "Creating/updating admin user '$admin_username'..."
cd "$APP_DIR/server"
sudo -u "$APP_USER" npx tsx src/db/reset-admin.ts "$admin_username" "$admin_password"

echo ""
echo "==================================="
echo "Admin credentials have been updated!"
echo "You can now log in with:"
echo "  Username: $admin_username"
echo "  Password: (the password you just entered)"
echo "==================================="
