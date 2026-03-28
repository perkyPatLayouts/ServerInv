#!/usr/bin/env bash
#
# ServerInv Shared Hosting Deployment Script
#
# This script deploys ServerInv to shared hosting environments (cPanel/DirectAdmin)
# where root access is not available.
#
# Requirements:
# - cPanel or DirectAdmin control panel
# - Node.js 20+ available
# - PostgreSQL database access
# - Sufficient disk space (~200MB)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  ServerInv Shared Hosting Deployment"
echo "=========================================="
echo ""

# Detect control panel
PANEL=""
if command -v uapi &> /dev/null; then
  PANEL="cpanel"
  echo -e "${GREEN}✓ Detected: cPanel${NC}"
elif [ -f /usr/local/directadmin/directadmin ]; then
  PANEL="directadmin"
  echo -e "${GREEN}✓ Detected: DirectAdmin${NC}"
else
  echo -e "${RED}✗ Error: No supported control panel detected${NC}"
  echo ""
  echo "This script requires cPanel or DirectAdmin."
  echo "For VPS/dedicated server deployment, use: ./deploy/setup.sh"
  exit 1
fi

echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Error: Node.js not found${NC}"
  echo ""
  echo "Please install Node.js 20+ through your control panel:"
  if [ "$PANEL" == "cpanel" ]; then
    echo "  1. Log into cPanel"
    echo "  2. Go to 'Setup Node.js App'"
    echo "  3. Install Node.js 20 or higher"
  else
    echo "  1. Log into DirectAdmin"
    echo "  2. Go to 'Node.js Selector'"
    echo "  3. Install Node.js 20 or higher"
  fi
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}✗ Error: Node.js 20+ required (found: $(node -v))${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ Error: npm not found${NC}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

echo ""
echo "=========================================="
echo "  Configuration"
echo "=========================================="
echo ""

# Interactive prompts
read -rp "Domain name (e.g., serverinv.yourdomain.com): " DOMAIN
while [ -z "$DOMAIN" ]; do
  echo -e "${RED}Domain name is required${NC}"
  read -rp "Domain name: " DOMAIN
done

echo ""
echo -e "${GREEN}ℹ️  Application URL will be set to: https://$DOMAIN${NC}"
echo "   This URL is used for password reset email links."

echo ""
echo "=========================================="
echo "  Database Selection"
echo "=========================================="
echo ""
echo "  1) PostgreSQL (recommended)"
echo "  2) MySQL/MariaDB (if PostgreSQL unavailable)"
echo ""
read -rp "Select database [1-2] (default: 1): " DB_CHOICE
DB_CHOICE=${DB_CHOICE:-1}

if [ "$DB_CHOICE" == "2" ]; then
  # MySQL setup
  echo ""
  echo "MySQL/MariaDB Setup Instructions:"
  if [ "$PANEL" == "cpanel" ]; then
    echo "  1. Log into cPanel"
    echo "  2. Go to 'MySQL Databases'"
    echo "  3. Create a database (e.g., serverinv)"
    echo "  4. Create a user with a strong password"
    echo "  5. Grant ALL privileges to the user on the database"
  else
    echo "  1. Log into DirectAdmin"
    echo "  2. Go to 'MySQL Management'"
    echo "  3. Create a database and user"
    echo "  4. Grant all privileges"
  fi

  echo ""
  read -rp "MySQL database name: " DB_NAME
  while [ -z "$DB_NAME" ]; do
    echo -e "${RED}Database name is required${NC}"
    read -rp "MySQL database name: " DB_NAME
  done

  read -rp "MySQL username: " DB_USER
  while [ -z "$DB_USER" ]; do
    echo -e "${RED}Username is required${NC}"
    read -rp "MySQL username: " DB_USER
  done

  read -rsp "MySQL password: " DB_PASS
  echo ""
  while [ -z "$DB_PASS" ]; do
    echo -e "${RED}Password is required${NC}"
    read -rsp "MySQL password: " DB_PASS
    echo ""
  done

  read -rp "MySQL host [localhost]: " DB_HOST
  DB_HOST=${DB_HOST:-localhost}

  read -rp "MySQL port [3306]: " DB_PORT
  DB_PORT=${DB_PORT:-3306}

  DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
else
  # PostgreSQL setup
  echo ""
  echo "PostgreSQL Setup Instructions:"
  if [ "$PANEL" == "cpanel" ]; then
    echo "  1. Log into cPanel"
    echo "  2. Go to 'PostgreSQL Databases'"
    echo "  3. Create a database (e.g., serverinv)"
    echo "  4. Create a user with a strong password"
    echo "  5. Grant ALL privileges to the user on the database"
  else
    echo "  1. Log into DirectAdmin"
    echo "  2. Go to 'PostgreSQL Management'"
    echo "  3. Create a database and user"
    echo "  4. Grant all privileges"
  fi

  echo ""
  read -rp "PostgreSQL database name: " DB_NAME
  while [ -z "$DB_NAME" ]; do
    echo -e "${RED}Database name is required${NC}"
    read -rp "PostgreSQL database name: " DB_NAME
  done

  read -rp "PostgreSQL username: " DB_USER
  while [ -z "$DB_USER" ]; do
    echo -e "${RED}Username is required${NC}"
    read -rp "PostgreSQL username: " DB_USER
  done

  read -rsp "PostgreSQL password: " DB_PASS
  echo ""
  while [ -z "$DB_PASS" ]; do
    echo -e "${RED}Password is required${NC}"
    read -rsp "PostgreSQL password: " DB_PASS
    echo ""
  done

  read -rp "PostgreSQL host [localhost]: " DB_HOST
  DB_HOST=${DB_HOST:-localhost}

  read -rp "PostgreSQL port [5432]: " DB_PORT
  DB_PORT=${DB_PORT:-5432}

  DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Determine app directory (default to home)
APP_DIR="$HOME/serverinv"
echo ""
read -rp "App directory [$APP_DIR]: " custom_dir
[ -n "$custom_dir" ] && APP_DIR="$custom_dir"

echo ""
echo "=========================================="
echo "  Installation"
echo "=========================================="
echo ""

# Create directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p "$APP_DIR" "$APP_DIR/tmp"
echo -e "${GREEN}✓ Directories created${NC}"

# Copy files
echo -e "${BLUE}Copying application files...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ ! -d "$PROJECT_ROOT/server" ] || [ ! -d "$PROJECT_ROOT/client" ]; then
  echo -e "${RED}✗ Error: Source files not found${NC}"
  echo "Please run this script from the project root directory."
  exit 1
fi

cp -r "$PROJECT_ROOT/server" "$APP_DIR/"
cp -r "$PROJECT_ROOT/client" "$APP_DIR/"
cp -r "$PROJECT_ROOT/deploy" "$APP_DIR/"
echo -e "${GREEN}✓ Files copied${NC}"

# Generate secure JWT secret
echo -e "${BLUE}Generating secure credentials...${NC}"
if command -v openssl &> /dev/null; then
  JWT_SECRET=$(openssl rand -hex 32)
else
  # Fallback if openssl not available
  JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
fi
echo -e "${GREEN}✓ JWT secret generated${NC}"

# Prompt for CORS allowed origins
echo ""
echo -e "${BLUE}Configuring CORS (Cross-Origin Resource Sharing)${NC}"
echo "The main domain will be automatically allowed:"
echo "  - https://$DOMAIN"
echo "  - http://$DOMAIN"
echo ""
ALLOWED_ORIGINS="https://$DOMAIN,http://$DOMAIN"

read -p "Do you want to add additional allowed origins? (y/N): " add_origins
if [[ "$add_origins" =~ ^[Yy]$ ]]; then
  echo ""
  echo "Enter additional origins (comma-separated, no spaces)."
  echo "Examples:"
  echo "  - https://app.example.com,https://www.example.com"
  echo "  - https://subdomain.example.com"
  echo ""
  read -p "Additional origins: " additional_origins
  if [ -n "$additional_origins" ]; then
    ALLOWED_ORIGINS="$ALLOWED_ORIGINS,$additional_origins"
  fi
fi

# Prompt for SMTP configuration (optional, for password reset emails)
echo ""
echo -e "${BLUE}SMTP Configuration (Optional - for password reset emails)${NC}"
echo "Leave blank to skip SMTP configuration."
echo ""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

read -p "Do you want to configure SMTP for password reset emails? (y/N): " configure_smtp
if [[ "$configure_smtp" =~ ^[Yy]$ ]]; then
  read -p "SMTP server hostname (e.g., smtp.gmail.com): " SMTP_HOST
  if [ -n "$SMTP_HOST" ]; then
    read -p "SMTP port [587]: " smtp_port_input
    SMTP_PORT="${smtp_port_input:-587}"
    read -p "SMTP username/email: " SMTP_USER
    read -sp "SMTP password: " SMTP_PASS
    echo
    read -p "From email address [$SMTP_USER]: " smtp_from_input
    SMTP_FROM="${smtp_from_input:-$SMTP_USER}"
    echo -e "${GREEN}✓ SMTP configured${NC}"
  else
    echo "Skipping SMTP configuration (no hostname provided)"
  fi
fi

# Create .env files
echo ""
echo -e "${BLUE}Creating environment configuration...${NC}"
cat > "$APP_DIR/server/.env" << EOF
# Database Configuration
DATABASE_URL=$DATABASE_URL

# Security
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=$ALLOWED_ORIGINS
APP_URL=https://$DOMAIN

# SMTP Configuration (for password reset emails)
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM=$SMTP_FROM

# Shared Hosting Configuration
TMP_DIR=$APP_DIR/tmp
DEPLOYMENT_TYPE=shared
CONTROL_PANEL=$PANEL
EOF

cp "$APP_DIR/server/.env" "$APP_DIR/.env"
echo -e "${GREEN}✓ Environment configured${NC}"

# Install server dependencies
echo -e "${BLUE}Installing server dependencies...${NC}"
cd "$APP_DIR/server"
npm install --production --silent
echo -e "${GREEN}✓ Server dependencies installed${NC}"

# Build server
echo -e "${BLUE}Building server...${NC}"
npm run build
echo -e "${GREEN}✓ Server built${NC}"

# Install client dependencies and build
echo -e "${BLUE}Installing client dependencies...${NC}"
cd "$APP_DIR/client"
npm install --silent
echo -e "${GREEN}✓ Client dependencies installed${NC}"

echo -e "${BLUE}Building client...${NC}"
npm run build
echo -e "${GREEN}✓ Client built${NC}"

# Run database migrations
echo -e "${BLUE}Running database migrations...${NC}"
cd "$APP_DIR/server"

# Test database connection first
if ! node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT 1').then(() => {console.log('OK'); pool.end();}).catch(err => {console.error(err.message); process.exit(1);});" &> /dev/null; then
  echo -e "${RED}✗ Error: Cannot connect to PostgreSQL database${NC}"
  echo ""
  echo "Please verify:"
  echo "  1. Database '$DB_NAME' exists"
  echo "  2. User '$DB_USER' has access to the database"
  echo "  3. PostgreSQL is running on $DB_HOST:$DB_PORT"
  exit 1
fi

npx tsx src/db/migrate.ts
echo -e "${GREEN}✓ Database migrated${NC}"

echo -e "${BLUE}Seeding initial data...${NC}"
npx tsx src/db/seed.ts
echo -e "${GREEN}✓ Database seeded${NC}"

echo ""
echo "=========================================="
echo "  Control Panel Integration"
echo "=========================================="
echo ""

if [ "$PANEL" == "cpanel" ]; then
  echo -e "${BLUE}Registering with cPanel...${NC}"

  # Detect web server (Apache vs LiteSpeed)
  WEB_SERVER="Unknown"
  if command -v httpd &> /dev/null; then
    if httpd -v 2>&1 | grep -q "LiteSpeed"; then
      WEB_SERVER="LiteSpeed"
    else
      WEB_SERVER="Apache"
    fi
  elif command -v lshttpd &> /dev/null; then
    WEB_SERVER="LiteSpeed"
  elif command -v apache2 &> /dev/null; then
    WEB_SERVER="Apache"
  fi

  if [ "$WEB_SERVER" != "Unknown" ]; then
    echo -e "${GREEN}✓ Detected web server: $WEB_SERVER${NC}"
  fi

  # Try to register Node.js app via uapi
  if uapi NodeJS create_application \
    --path="$APP_DIR/server" \
    --startup_file="dist/index.js" \
    --app_port=3000 \
    --app_mode=production &> /dev/null; then
    echo -e "${GREEN}✓ Application registered with cPanel${NC}"
  else
    echo -e "${YELLOW}⚠ Could not auto-register application${NC}"
    echo "You'll need to register manually (see instructions below)"
  fi

  echo ""
  echo -e "${YELLOW}=========================================="
  echo "  NEXT STEPS - cPanel Configuration"
  echo "==========================================${NC}"
  echo ""
  echo "1. ${BLUE}Setup Node.js Application:${NC}"
  echo "   • Log into cPanel"
  echo "   • Go to 'Setup Node.js App'"
  echo "   • Find 'serverinv' application"
  echo "   • Click 'Run NPM Install' (if needed)"
  echo "   • Click 'Start Application'"
  echo "   • Note the application URL (e.g., http://127.0.0.1:3000)"
  echo ""
  echo "2. ${BLUE}Setup Domain:${NC}"
  echo "   • In cPanel, go to 'Domains' or 'Subdomains'"
  echo "   • Create domain/subdomain: ${GREEN}$DOMAIN${NC}"
  echo "   • Set document root to: ${GREEN}$APP_DIR/client/dist${NC}"
  echo ""
  echo "3. ${BLUE}Configure Reverse Proxy:${NC}"

  if [ "$WEB_SERVER" == "LiteSpeed" ]; then
    echo "   • ${GREEN}LiteSpeed detected${NC} - optimized configuration will be used"
    echo "   • Add to ${GREEN}$APP_DIR/client/dist/.htaccess${NC}:"
    echo ""
    echo "     # LiteSpeed optimized configuration"
    echo "     <IfModule LiteSpeed>"
    echo "       RewriteEngine On"
    echo "       "
    echo "       # Enable LiteSpeed Cache for static assets"
    echo "       <FilesMatch \"\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$\">"
    echo "         Header set Cache-Control \"public, max-age=31536000\""
    echo "       </FilesMatch>"
    echo "       "
    echo "       # Proxy API requests to Node.js backend"
    echo "       RewriteCond %{REQUEST_URI} ^/api"
    echo "       RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/\$1 [P,L]"
    echo "       "
    echo "       # SPA routing - serve index.html for non-file requests"
    echo "       RewriteCond %{REQUEST_FILENAME} !-f"
    echo "       RewriteCond %{REQUEST_FILENAME} !-d"
    echo "       RewriteRule . /index.html [L]"
    echo "     </IfModule>"
  else
    echo "   • Add to ${GREEN}$APP_DIR/client/dist/.htaccess${NC}:"
    echo ""
    echo "     RewriteEngine On"
    echo "     "
    echo "     # Proxy API requests to Node.js backend"
    echo "     RewriteCond %{REQUEST_URI} ^/api"
    echo "     RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/\$1 [P,L]"
    echo "     "
    echo "     # SPA routing - serve index.html for non-file requests"
    echo "     RewriteCond %{REQUEST_FILENAME} !-f"
    echo "     RewriteCond %{REQUEST_FILENAME} !-d"
    echo "     RewriteRule . /index.html [L]"
  fi
  echo ""
  echo "4. ${BLUE}Enable SSL:${NC}"
  echo "   • In cPanel, go to 'SSL/TLS Status'"
  echo "   • Enable AutoSSL or Let's Encrypt for: $DOMAIN"
  echo ""
  echo "5. ${BLUE}Test the deployment:${NC}"
  echo "   • Visit: ${GREEN}https://$DOMAIN${NC}"
  echo "   • Login with: ${GREEN}admin${NC} / ${GREEN}admin${NC}"
  echo "   • ${RED}IMPORTANT: Change the admin password immediately!${NC}"
  echo ""

elif [ "$PANEL" == "directadmin" ]; then
  echo -e "${BLUE}Registering with DirectAdmin...${NC}"

  # Check for Node.js Selector
  if [ -x /usr/local/bin/nodejs_selector ]; then
    if nodejs_selector create \
      --path="$APP_DIR/server" \
      --entry="dist/index.js" \
      --port=3000 &> /dev/null; then
      echo -e "${GREEN}✓ Application registered with DirectAdmin Node.js Selector${NC}"
    else
      echo -e "${YELLOW}⚠ Could not auto-register application${NC}"
    fi
  else
    # Fallback to systemd --user
    echo -e "${BLUE}Setting up systemd user service...${NC}"
    mkdir -p ~/.config/systemd/user
    cat > ~/.config/systemd/user/serverinv.service << 'SERVICE'
[Unit]
Description=ServerInv Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
SERVICE

    # Replace $APP_DIR placeholder
    sed -i "s|\$APP_DIR|$APP_DIR|g" ~/.config/systemd/user/serverinv.service

    if systemctl --user daemon-reload && \
       systemctl --user enable serverinv && \
       systemctl --user start serverinv; then
      echo -e "${GREEN}✓ Application registered as systemd user service${NC}"
    else
      echo -e "${YELLOW}⚠ Could not start systemd service${NC}"
    fi
  fi

  echo ""
  echo -e "${YELLOW}=========================================="
  echo "  NEXT STEPS - DirectAdmin Configuration"
  echo "==========================================${NC}"
  echo ""
  echo "1. ${BLUE}Start Node.js Application:${NC}"
  echo "   • Log into DirectAdmin"
  echo "   • Go to 'Node.js Selector'"
  echo "   • Start the serverinv application"
  echo ""
  echo "2. ${BLUE}Setup Domain:${NC}"
  echo "   • In DirectAdmin, go to 'Domain Setup'"
  echo "   • Create domain/subdomain: ${GREEN}$DOMAIN${NC}"
  echo "   • Set document root to: ${GREEN}$APP_DIR/client/dist${NC}"
  echo ""
  echo "3. ${BLUE}Configure Reverse Proxy:${NC}"
  echo "   • In DirectAdmin, go to domain settings"
  echo "   • Enable 'Proxy' for /api path"
  echo "   • Set proxy target: http://localhost:3000/api"
  echo "   • Or manually add to ${GREEN}$APP_DIR/client/dist/.htaccess${NC}:"
  echo ""
  echo "     RewriteEngine On"
  echo "     RewriteCond %{REQUEST_URI} ^/api"
  echo "     RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/\$1 [P,L]"
  echo "     "
  echo "     RewriteCond %{REQUEST_FILENAME} !-f"
  echo "     RewriteCond %{REQUEST_FILENAME} !-d"
  echo "     RewriteRule . /index.html [L]"
  echo ""
  echo "4. ${BLUE}Enable SSL:${NC}"
  echo "   • In DirectAdmin, go to 'SSL Certificates'"
  echo "   • Enable Let's Encrypt for: $DOMAIN"
  echo ""
  echo "5. ${BLUE}Test the deployment:${NC}"
  echo "   • Visit: ${GREEN}https://$DOMAIN${NC}"
  echo "   • Login with: ${GREEN}admin${NC} / ${GREEN}admin${NC}"
  echo "   • ${RED}IMPORTANT: Change the admin password immediately!${NC}"
  echo ""
fi

echo "=========================================="
echo "  ${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "  ${BLUE}Configuration Summary:${NC}"
echo "  • Domain:      ${GREEN}$DOMAIN${NC}"
echo "  • App Dir:     ${GREEN}$APP_DIR${NC}"
echo "  • Backend:     ${GREEN}http://localhost:3000${NC}"
echo "  • Database:    ${GREEN}$DB_NAME${NC}"
echo "  • Panel:       ${GREEN}$PANEL${NC}"
echo ""
echo "  ${BLUE}Default Credentials:${NC}"
echo "  • Username:    ${GREEN}admin${NC}"
echo "  • Password:    ${GREEN}admin${NC}"
echo ""
echo "  ${RED}⚠️  SECURITY REMINDERS:${NC}"
echo "  1. Complete the control panel setup steps above"
echo "  2. Change admin password after first login"
echo "  3. Test backup/restore functionality"
echo "  4. Keep your JWT_SECRET secure"
echo ""
echo "=========================================="
echo ""
