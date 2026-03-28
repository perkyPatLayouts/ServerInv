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
echo "ℹ️  Note: ALLOWED_ORIGINS is automatically set from APP_URL (both http and https)."
echo "   Only update this if you need additional origins beyond the main domain."
echo ""
read -p "Do you want to manually override ALLOWED_ORIGINS? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Current ALLOWED_ORIGINS in .env:"
  grep ALLOWED_ORIGINS "$APP_DIR/server/.env" || echo "  (not found)"
  echo ""
  echo "⚠️  WARNING: This will override the automatic setting from APP_URL."
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

# Optional: Update APP_URL
echo ""
echo "==> Application URL Configuration"
read -p "Do you want to update APP_URL (for password reset links)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Current APP_URL in .env:"
  grep APP_URL "$APP_DIR/server/.env" || echo "  (not found)"
  echo ""
  echo "Enter the full URL where your application is accessible."
  echo "Examples:"
  echo "  - https://serverinv.example.com"
  echo "  - https://inventory.mycompany.com"
  echo "  - http://example.com:3000 (if not using SSL)"
  echo ""
  read -p "Application URL: " app_url
  if [ -n "$app_url" ]; then
    # Extract domain from URL (remove protocol and port)
    domain=$(echo "$app_url" | sed -e 's|^https\?://||' -e 's|:[0-9]*$||')

    # Set ALLOWED_ORIGINS to both http and https
    allowed_origins="https://$domain,http://$domain"

    echo ""
    echo "ℹ️  ALLOWED_ORIGINS will be automatically set to:"
    echo "   $allowed_origins"
    echo ""

    # Update APP_URL in server/.env
    if grep -q "^APP_URL=" "$APP_DIR/server/.env"; then
      sed -i "s|^APP_URL=.*|APP_URL=$app_url|" "$APP_DIR/server/.env"
      echo "✓ Updated APP_URL in $APP_DIR/server/.env"
    else
      echo "APP_URL=$app_url" >> "$APP_DIR/server/.env"
      echo "✓ Added APP_URL to $APP_DIR/server/.env"
    fi

    # Update ALLOWED_ORIGINS in server/.env
    if grep -q "^ALLOWED_ORIGINS=" "$APP_DIR/server/.env"; then
      sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$allowed_origins|" "$APP_DIR/server/.env"
      echo "✓ Updated ALLOWED_ORIGINS in $APP_DIR/server/.env"
    else
      echo "ALLOWED_ORIGINS=$allowed_origins" >> "$APP_DIR/server/.env"
      echo "✓ Added ALLOWED_ORIGINS to $APP_DIR/server/.env"
    fi

    # Also update root .env if it exists
    if [ -f "$APP_DIR/.env" ]; then
      if grep -q "^APP_URL=" "$APP_DIR/.env"; then
        sed -i "s|^APP_URL=.*|APP_URL=$app_url|" "$APP_DIR/.env"
      else
        echo "APP_URL=$app_url" >> "$APP_DIR/.env"
      fi

      if grep -q "^ALLOWED_ORIGINS=" "$APP_DIR/.env"; then
        sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$allowed_origins|" "$APP_DIR/.env"
      else
        echo "ALLOWED_ORIGINS=$allowed_origins" >> "$APP_DIR/.env"
      fi

      echo "✓ Updated APP_URL and ALLOWED_ORIGINS in $APP_DIR/.env"
    fi
  else
    echo "No URL entered. Skipping APP_URL update."
  fi
fi

# Optional: Update SMTP configuration
echo ""
echo "==> SMTP Configuration"
read -p "Do you want to update SMTP settings? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Current SMTP configuration:"
  grep -E "SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_FROM" "$APP_DIR/server/.env" || echo "  (not configured)"
  echo ""
  echo "Configure SMTP for password reset emails."
  read -p "SMTP server hostname (e.g., smtp.gmail.com): " smtp_host
  if [ -n "$smtp_host" ]; then
    read -p "SMTP port [587]: " smtp_port
    SMTP_PORT="${smtp_port:-587}"
    read -p "SMTP username/email: " smtp_user
    read -sp "SMTP password: " smtp_pass
    echo
    read -p "From email address [$smtp_user]: " smtp_from
    SMTP_FROM="${smtp_from:-$smtp_user}"

    # Update SMTP settings in server/.env
    for var in "SMTP_HOST=$smtp_host" "SMTP_PORT=$SMTP_PORT" "SMTP_USER=$smtp_user" "SMTP_PASS=$smtp_pass" "SMTP_FROM=$SMTP_FROM"; do
      key=$(echo "$var" | cut -d= -f1)
      value=$(echo "$var" | cut -d= -f2-)
      if grep -q "^$key=" "$APP_DIR/server/.env"; then
        sed -i "s|^$key=.*|$key=$value|" "$APP_DIR/server/.env"
      else
        echo "$key=$value" >> "$APP_DIR/server/.env"
      fi
    done

    # Also update root .env if it exists
    if [ -f "$APP_DIR/.env" ]; then
      for var in "SMTP_HOST=$smtp_host" "SMTP_PORT=$SMTP_PORT" "SMTP_USER=$smtp_user" "SMTP_PASS=$smtp_pass" "SMTP_FROM=$SMTP_FROM"; do
        key=$(echo "$var" | cut -d= -f1)
        value=$(echo "$var" | cut -d= -f2-)
        if grep -q "^$key=" "$APP_DIR/.env"; then
          sed -i "s|^$key=.*|$key=$value|" "$APP_DIR/.env"
        else
          echo "$key=$value" >> "$APP_DIR/.env"
        fi
      done
    fi

    echo "✓ SMTP configuration updated"
  else
    echo "No SMTP host entered. Skipping SMTP update."
  fi
fi

echo ""
echo "==> Restarting ServerInv service"
systemctl start serverinv

echo ""
echo "==> Update complete!"
echo "    Service status:"
systemctl status serverinv --no-pager -l
