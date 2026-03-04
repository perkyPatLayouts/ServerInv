#!/usr/bin/env bash
set -euo pipefail

# ServerInv deployment script for Ubuntu/Debian
# Run as root or with sudo

APP_USER="serverinv"
APP_DIR="/opt/serverinv"
DB_NAME="serverinv"
DB_USER="serverinv"
DB_PASS="$(openssl rand -hex 16)"
JWT_SECRET="$(openssl rand -hex 32)"

echo "==> Installing system packages"
apt-get update
apt-get install -y curl nginx postgresql postgresql-contrib

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

echo "==> Setting up nginx"
cp $APP_DIR/deploy/serverinv.nginx /etc/nginx/sites-available/serverinv
ln -sf /etc/nginx/sites-available/serverinv /etc/nginx/sites-enabled/serverinv
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "==> Deployment complete!"
echo "    App URL: http://$(hostname -I | awk '{print $1}')"
echo "    Default login: admin / admin"
echo "    Database password: $DB_PASS"
echo "    JWT secret: $JWT_SECRET"
echo ""
echo "    For HTTPS, run: certbot --nginx -d yourdomain.com"
