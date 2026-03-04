#!/usr/bin/env bash
set -euo pipefail

# ServerInv deployment script for Ubuntu/Debian
# Run as root or with sudo
# Usage: sudo bash setup.sh [git-repo-url]

APP_USER="serverinv"
APP_DIR="/opt/serverinv"
DB_NAME="serverinv"
DB_USER="serverinv"
DB_PASS="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -hex 32)"

# Prompt for domain name
read -rp "Enter the application domain name (e.g. serverinv.example.com): " APP_DOMAIN
if [ -z "$APP_DOMAIN" ]; then
  echo "Error: domain name is required."
  exit 1
fi

echo "==> Installing system packages"
apt-get update
apt-get install -y curl nginx postgresql postgresql-contrib certbot python3-certbot-nginx

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

echo "==> Setting up nginx (HTTP for $APP_DOMAIN)"
cat > /etc/nginx/sites-available/serverinv << NGINX
server {
    listen 80;
    server_name $APP_DOMAIN;

    root /opt/serverinv/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/serverinv /etc/nginx/sites-enabled/serverinv
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Obtaining SSL certificate for $APP_DOMAIN"
certbot --nginx -d "$APP_DOMAIN" --non-interactive --agree-tos --redirect --register-unsafely-without-email || {
  echo "    WARNING: SSL certificate request failed."
  echo "    Make sure DNS for $APP_DOMAIN points to this server."
  echo "    You can retry manually: certbot --nginx -d $APP_DOMAIN"
}

echo ""
echo "==> Deployment complete!"
echo "    Domain:   $APP_DOMAIN"
echo "    App URL:  https://$APP_DOMAIN"
echo "    Default login: admin / admin"
echo "    Database password: $DB_PASS"
echo "    JWT secret: $JWT_SECRET"
echo ""
echo "    SSL auto-renewal is handled by certbot's systemd timer."
