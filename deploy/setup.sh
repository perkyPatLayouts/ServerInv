#!/usr/bin/env bash
set -euo pipefail

# ServerInv deployment script for Ubuntu/Debian
# Run as root or with sudo
# Usage: sudo bash setup.sh [git-repo-url]

# Detect shared hosting environment (no root access and cannot write to /etc)
if [ "$(id -u)" -ne 0 ] && [ ! -w /etc 2>/dev/null ]; then
  echo "=========================================="
  echo "  Shared Hosting Environment Detected"
  echo "=========================================="
  echo ""
  echo "This script requires root access for VPS/dedicated server deployment."
  echo "Redirecting to shared hosting deployment script..."
  echo ""
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  exec bash "$SCRIPT_DIR/setup-shared.sh" "$@"
fi

# Check for root privileges (VPS/dedicated deployment)
if [ "$(id -u)" -ne 0 ]; then
  echo "Error: This script must be run as root or with sudo"
  echo "Usage: sudo bash setup.sh"
  echo ""
  echo "If you're on shared hosting (cPanel/DirectAdmin), use:"
  echo "  bash deploy/setup-shared.sh"
  exit 1
fi

APP_USER="serverinv"
APP_DIR="/opt/serverinv"
DB_NAME="serverinv"
DB_USER="serverinv"
DB_PASS="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -hex 32)"

echo "=========================================="
echo "    ServerInv Deployment Script"
echo "=========================================="
echo ""

# Prompt for domain name
while true; do
  read -rp "Enter the application domain name (e.g. serverinv.example.com): " APP_DOMAIN
  if [ -n "$APP_DOMAIN" ]; then
    break
  fi
  echo "Error: domain name is required."
done

echo ""
echo "==> Detecting existing web servers..."

# Detect existing web servers
NGINX_INSTALLED=false
APACHE_INSTALLED=false
NGINX_RUNNING=false
APACHE_RUNNING=false

if command -v nginx &> /dev/null; then
  NGINX_INSTALLED=true
  if systemctl is-active --quiet nginx 2>/dev/null; then
    NGINX_RUNNING=true
  fi
fi

if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
  APACHE_INSTALLED=true
  if systemctl is-active --quiet apache2 2>/dev/null || systemctl is-active --quiet httpd 2>/dev/null; then
    APACHE_RUNNING=true
  fi
fi

# Display detection results
if [ "$NGINX_INSTALLED" = true ]; then
  if [ "$NGINX_RUNNING" = true ]; then
    echo "    ✓ Nginx detected and running"
  else
    echo "    ✓ Nginx detected (not running)"
  fi
fi

if [ "$APACHE_INSTALLED" = true ]; then
  if [ "$APACHE_RUNNING" = true ]; then
    echo "    ✓ Apache detected and running"
  else
    echo "    ✓ Apache detected (not running)"
  fi
fi

if [ "$NGINX_INSTALLED" = false ] && [ "$APACHE_INSTALLED" = false ]; then
  echo "    No web server detected"
fi

echo ""

# Ask user which web server to use
WEB_SERVER=""
if [ "$NGINX_INSTALLED" = true ] && [ "$APACHE_INSTALLED" = true ]; then
  echo "Both Nginx and Apache are installed on this system."
  echo ""
  echo "Which web server would you like to use for ServerInv?"
  echo "  1) Nginx (recommended)"
  echo "  2) Apache"
  echo ""
  while true; do
    read -rp "Enter your choice (1 or 2): " choice
    case $choice in
      1)
        WEB_SERVER="nginx"
        break
        ;;
      2)
        WEB_SERVER="apache"
        break
        ;;
      *)
        echo "Invalid choice. Please enter 1 or 2."
        ;;
    esac
  done
elif [ "$NGINX_INSTALLED" = true ]; then
  echo "Nginx is installed. Use Nginx for ServerInv? (Y/n)"
  read -rp "> " choice
  if [[ "$choice" =~ ^[Nn] ]]; then
    echo "Would you like to install Apache instead? (y/N)"
    read -rp "> " choice
    if [[ "$choice" =~ ^[Yy] ]]; then
      WEB_SERVER="apache"
    else
      echo "Aborting deployment."
      exit 1
    fi
  else
    WEB_SERVER="nginx"
  fi
elif [ "$APACHE_INSTALLED" = true ]; then
  echo "Apache is installed. Use Apache for ServerInv? (Y/n)"
  read -rp "> " choice
  if [[ "$choice" =~ ^[Nn] ]]; then
    echo "Would you like to install Nginx instead? (y/N)"
    read -rp "> " choice
    if [[ "$choice" =~ ^[Yy] ]]; then
      WEB_SERVER="nginx"
    else
      echo "Aborting deployment."
      exit 1
    fi
  else
    WEB_SERVER="apache"
  fi
else
  echo "No web server is installed."
  echo ""
  echo "Which web server would you like to install?"
  echo "  1) Nginx (recommended)"
  echo "  2) Apache"
  echo ""
  while true; do
    read -rp "Enter your choice (1 or 2): " choice
    case $choice in
      1)
        WEB_SERVER="nginx"
        break
        ;;
      2)
        WEB_SERVER="apache"
        break
        ;;
      *)
        echo "Invalid choice. Please enter 1 or 2."
        ;;
    esac
  done
fi

echo ""
echo "Selected web server: $WEB_SERVER"
echo ""

# Check for existing site configurations that might conflict
if [ "$WEB_SERVER" = "nginx" ]; then
  if [ -f "/etc/nginx/sites-enabled/serverinv" ]; then
    echo "⚠️  WARNING: /etc/nginx/sites-enabled/serverinv already exists"
    echo "    This configuration will be replaced."
    read -rp "    Continue? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy] ]]; then
      echo "Aborting deployment."
      exit 1
    fi
  fi

  # Check if domain is already configured
  if grep -rq "server_name.*$APP_DOMAIN" /etc/nginx/sites-enabled/ 2>/dev/null; then
    echo "⚠️  WARNING: Domain $APP_DOMAIN is already configured in Nginx"
    existing_config=$(grep -r "server_name.*$APP_DOMAIN" /etc/nginx/sites-enabled/ | head -1 | cut -d: -f1)
    echo "    Found in: $existing_config"
    echo "    This may cause conflicts."
    read -rp "    Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy] ]]; then
      echo "Aborting deployment."
      exit 1
    fi
  fi
elif [ "$WEB_SERVER" = "apache" ]; then
  if [ -f "/etc/apache2/sites-enabled/serverinv.conf" ] || [ -f "/etc/httpd/conf.d/serverinv.conf" ]; then
    echo "⚠️  WARNING: ServerInv Apache configuration already exists"
    echo "    This configuration will be replaced."
    read -rp "    Continue? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy] ]]; then
      echo "Aborting deployment."
      exit 1
    fi
  fi

  # Check if domain is already configured
  if grep -rq "ServerName.*$APP_DOMAIN" /etc/apache2/sites-enabled/ 2>/dev/null || \
     grep -rq "ServerName.*$APP_DOMAIN" /etc/httpd/conf.d/ 2>/dev/null; then
    echo "⚠️  WARNING: Domain $APP_DOMAIN is already configured in Apache"
    existing_config=$(grep -r "ServerName.*$APP_DOMAIN" /etc/apache2/sites-enabled/ /etc/httpd/conf.d/ 2>/dev/null | head -1 | cut -d: -f1)
    echo "    Found in: $existing_config"
    echo "    This may cause conflicts."
    read -rp "    Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy] ]]; then
      echo "Aborting deployment."
      exit 1
    fi
  fi
fi

echo ""
echo "==> Installing system packages"
apt-get update

# Install web server if needed
if [ "$WEB_SERVER" = "nginx" ]; then
  apt-get install -y curl nginx postgresql postgresql-contrib certbot python3-certbot-nginx
elif [ "$WEB_SERVER" = "apache" ]; then
  apt-get install -y curl apache2 postgresql postgresql-contrib certbot python3-certbot-apache
fi

echo "==> Installing Node.js 20.x"
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Creating app user"
id -u $APP_USER &>/dev/null || useradd --system --create-home --shell /bin/bash $APP_USER

echo "==> Setting up PostgreSQL"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres createdb -O $DB_USER $DB_NAME

echo "==> Deploying application to $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  echo "    App directory already exists, pulling latest..."
  cd $APP_DIR
  sudo -u $APP_USER git pull
else
  REPO_URL="${1:-}"
  if [ -z "$REPO_URL" ]; then
    echo "    No git URL provided, copying files..."
    mkdir -p $APP_DIR
    cp -r . $APP_DIR/
  else
    git clone "$REPO_URL" $APP_DIR
  fi
  chown -R $APP_USER:$APP_USER $APP_DIR
fi

echo "==> Creating .env"
cat > $APP_DIR/.env << EOF
DATABASE_URL=postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_SECRET=$JWT_SECRET
PORT=3000
ALLOWED_ORIGINS=https://$APP_DOMAIN,http://$APP_DOMAIN
EOF
cp $APP_DIR/.env $APP_DIR/server/.env
chown $APP_USER:$APP_USER $APP_DIR/.env $APP_DIR/server/.env

echo "==> Installing dependencies"
cd $APP_DIR
sudo -u $APP_USER npm install

echo "==> Building frontend"
cd $APP_DIR/client
sudo -u $APP_USER npm run build

echo "==> Running database migrations and seed"
cd $APP_DIR/server
sudo -u $APP_USER npx tsx src/db/migrate.ts
sudo -u $APP_USER npx tsx src/db/seed.ts

echo "==> Setting up systemd service"
cp $APP_DIR/deploy/serverinv.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable serverinv
systemctl start serverinv

# Configure web server
if [ "$WEB_SERVER" = "nginx" ]; then
  echo "==> Configuring Nginx for $APP_DOMAIN"
  cat > /etc/nginx/sites-available/serverinv << 'NGINX'
server {
    listen 80;
    server_name APP_DOMAIN_PLACEHOLDER;

    root /opt/serverinv/client/dist;
    index index.html;

    # Increase timeout for backup/restore operations
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

  # Replace placeholder with actual domain
  sed -i "s/APP_DOMAIN_PLACEHOLDER/$APP_DOMAIN/g" /etc/nginx/sites-available/serverinv

  # Enable site
  ln -sf /etc/nginx/sites-available/serverinv /etc/nginx/sites-enabled/serverinv

  # Don't remove default site if other sites exist
  SITE_COUNT=$(ls -1 /etc/nginx/sites-enabled/ | wc -l)
  if [ "$SITE_COUNT" -eq 2 ] && [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "    Removing default Nginx site (only site besides ServerInv)"
    rm -f /etc/nginx/sites-enabled/default
  elif [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "    Keeping default Nginx site (other sites detected)"
  fi

  # Test and reload
  nginx -t && systemctl reload nginx

  echo "==> Obtaining SSL certificate for $APP_DOMAIN"
  certbot --nginx -d "$APP_DOMAIN" --non-interactive --agree-tos --redirect --register-unsafely-without-email || {
    echo "    WARNING: SSL certificate request failed."
    echo "    Make sure DNS for $APP_DOMAIN points to this server."
    echo "    You can retry manually: certbot --nginx -d $APP_DOMAIN"
  }

elif [ "$WEB_SERVER" = "apache" ]; then
  echo "==> Configuring Apache for $APP_DOMAIN"

  # Enable required modules
  a2enmod proxy proxy_http rewrite ssl headers 2>/dev/null || true

  # Create config
  cat > /etc/apache2/sites-available/serverinv.conf << 'APACHE'
<VirtualHost *:80>
    ServerName APP_DOMAIN_PLACEHOLDER

    DocumentRoot /opt/serverinv/client/dist

    # Increase timeout for backup/restore operations
    ProxyTimeout 300

    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:3000/api
    ProxyPassReverse /api http://127.0.0.1:3000/api

    # Serve static files
    <Directory /opt/serverinv/client/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted

        # Rewrite for client-side routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/serverinv-error.log
    CustomLog ${APACHE_LOG_DIR}/serverinv-access.log combined
</VirtualHost>
APACHE

  # Replace placeholder with actual domain
  sed -i "s/APP_DOMAIN_PLACEHOLDER/$APP_DOMAIN/g" /etc/apache2/sites-available/serverinv.conf

  # Enable site
  a2ensite serverinv.conf

  # Don't disable default site if other sites exist
  SITE_COUNT=$(ls -1 /etc/apache2/sites-enabled/ | wc -l)
  if [ "$SITE_COUNT" -eq 2 ] && [ -f "/etc/apache2/sites-enabled/000-default.conf" ]; then
    echo "    Disabling default Apache site (only site besides ServerInv)"
    a2dissite 000-default.conf
  elif [ -f "/etc/apache2/sites-enabled/000-default.conf" ]; then
    echo "    Keeping default Apache site (other sites detected)"
  fi

  # Test and reload
  apachectl configtest && systemctl reload apache2

  echo "==> Obtaining SSL certificate for $APP_DOMAIN"
  certbot --apache -d "$APP_DOMAIN" --non-interactive --agree-tos --redirect --register-unsafely-without-email || {
    echo "    WARNING: SSL certificate request failed."
    echo "    Make sure DNS for $APP_DOMAIN points to this server."
    echo "    You can retry manually: certbot --apache -d $APP_DOMAIN"
  }
fi

echo ""
echo "=========================================="
echo "    Deployment Complete!"
echo "=========================================="
echo ""
echo "  Web Server:  $WEB_SERVER"
echo "  Domain:      $APP_DOMAIN"
echo "  App URL:     https://$APP_DOMAIN"
echo ""
echo "  Default login: admin / admin"
echo "  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""
echo "  Database password: $DB_PASS"
echo "  JWT secret:        $JWT_SECRET"
echo ""
echo "  ⚠️  SAVE THESE CREDENTIALS IN A SECURE LOCATION!"
echo ""
echo "  SSL auto-renewal is handled by certbot's systemd timer."
echo ""
