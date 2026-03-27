# ServerInv

A modern web application for maintaining an inventory of VPS, Shared, and Bare Metal hosting servers. Track server specifications, providers, costs, renewals, and hosted websites/applications with ease.

## Features

- **Comprehensive Server Management** - Track VPS, Dedicated, and Shared hosting servers
- **Cost Tracking** - Monitor pricing, billing periods, and renewal dates
- **Provider Management** - Organize servers by hosting provider
- **Application Tracking** - Manage hosted websites and applications
- **Role-Based Access Control** - Administrator, Editor, and Viewer roles
- **Backup & Restore** - Built-in database backup with SFTP support
- **Flexible Database Support** - PostgreSQL or MySQL/MariaDB
- **Modern Tech Stack** - React + TypeScript + Tailwind CSS frontend, Node.js backend

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Node.js 20+** - JavaScript runtime
- **Express** - Web application framework
- **Drizzle ORM** - Type-safe SQL ORM
- **PostgreSQL** or **MySQL/MariaDB** - Database options
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## Database Support

ServerInv supports both PostgreSQL and MySQL/MariaDB databases:

- **PostgreSQL** (recommended) - Full feature support, recommended for VPS deployments
- **MySQL/MariaDB** - Alternative for shared hosting environments where PostgreSQL is unavailable

The database type is automatically detected from your \`DATABASE_URL\`:
- \`postgres://\` or \`postgresql://\` → PostgreSQL
- \`mysql://\` → MySQL/MariaDB

## Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL 14+** or **MySQL 8+/MariaDB 10+**
- **Ubuntu 24.04/Debian** (for production deployments)
- **Git** (for deployment from repository)

## Quick Start

### Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd ServerInv
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   # Copy example environment file
   cp server/.env.example server/.env

   # Edit server/.env and configure:
   # - DATABASE_URL (PostgreSQL or MySQL)
   # - JWT_SECRET (generate with: openssl rand -base64 32)
   # - PORT and ALLOWED_ORIGINS
   \`\`\`

4. **Run database migrations**
   \`\`\`bash
   cd server
   npm run db:migrate
   npm run db:seed  # Optional: Add sample data
   \`\`\`

5. **Start development servers**
   \`\`\`bash
   # From project root
   npm run dev
   \`\`\`

   Access the application at \`http://localhost:5173\`

### Default Credentials

- **Username:** \`admin\`
- **Password:** \`admin\`

**⚠️ IMPORTANT:** Change the default password immediately after first login in production!

## Production Deployment

ServerInv supports two deployment scenarios:

### VPS/Dedicated Server Deployment

For Ubuntu/Debian servers with root access:

\`\`\`bash
# Run as root or with sudo
sudo bash deploy/setup.sh
\`\`\`

The script will:
- Install Node.js, PostgreSQL/MySQL, and Nginx
- Configure SSL with Let's Encrypt
- Set up systemd service for auto-start
- Create production environment

**Database Selection:**
- PostgreSQL (recommended) - Full feature support
- MySQL/MariaDB - Alternative option

### Shared Hosting Deployment

For cPanel or DirectAdmin environments:

\`\`\`bash
# Run as hosting user (no sudo)
bash deploy/setup-shared.sh
\`\`\`

The script will:
- Detect control panel (cPanel/DirectAdmin)
- Configure Node.js application
- Set up database connection (PostgreSQL or MySQL)
- Configure domain and SSL

**Note:** MySQL/MariaDB is typically preferred on shared hosting as it's more commonly available through control panels.

## User Roles

### Administrator
- Full system access
- User management
- Backup/restore operations
- All CRUD operations

### Editor
- Data editing permissions
- Create, read, update, delete servers and related entities
- No user management or backup access

### Viewer
- Read-only access to all data
- View servers, applications, and related information
- No editing permissions

## Database Schema

The application tracks:

- **Servers** - Core server inventory with specifications
- **Websites** - Legacy one-to-many website tracking
- **Applications** - Modern many-to-many application tracking
- **Providers** - Hosting company information
- **Locations** - Server datacenter locations
- **Server Types** - VPS, Dedicated, Shared (with virtualization types)
- **Operating Systems** - OS name, version, and variant
- **CPU Types** - Processor specifications
- **Currencies** - Multi-currency support
- **Billing Periods** - Hourly to 3-yearly billing cycles
- **Payment Methods** - PayPal, credit card, etc.

## Backup System

Built-in backup functionality for administrators:

- **Database Dump** - Full SQL export
- **SFTP Upload** - Automatic offsite backup
- **Pure Node.js** - Works without native database tools
- **Database-Agnostic** - Supports both PostgreSQL and MySQL

Configure backup server in Settings → Backup Configuration.

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with 10 rounds
- **Role-Based Access Control** - Three-tier permission system
- **CORS Protection** - Configurable allowed origins
- **Helmet.js** - Security headers
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Drizzle ORM parameterized queries

## Environment Variables

\`\`\`bash
# Database (auto-detects type from protocol)
DATABASE_URL=postgres://user:pass@localhost:5432/serverinv
# or
DATABASE_URL=mysql://user:pass@localhost:3306/serverinv

# Security (REQUIRED - generate with: openssl rand -base64 32)
JWT_SECRET=your-secret-key-here

# Server
PORT=3000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:5173

# Optional: Backup temp directory
TMP_DIR=/tmp
\`\`\`

## Development

### Project Structure
\`\`\`
ServerInv/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
│   └── package.json
├── server/              # Node.js backend
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── db/          # Database & schemas
│   │   │   ├── schema/
│   │   │   │   ├── postgres/  # PostgreSQL schemas
│   │   │   │   └── mysql/     # MySQL schemas
│   │   ├── middleware/  # Auth, validation
│   │   └── services/    # Business logic
│   ├── drizzle/         # Database migrations
│   │   ├── postgres/    # PostgreSQL migrations
│   │   └── mysql/       # MySQL migrations
│   └── package.json
└── deploy/              # Deployment scripts
\`\`\`

### Available Scripts

**Root level:**
- \`npm run dev\` - Start both frontend and backend in development mode
- \`npm run build\` - Build both frontend and backend for production
- \`npm install\` - Install all dependencies

**Server:**
- \`npm run dev\` - Start backend with hot reload
- \`npm run build\` - Compile TypeScript to JavaScript
- \`npm run db:generate\` - Generate new migrations
- \`npm run db:migrate\` - Run pending migrations
- \`npm run db:seed\` - Seed database with initial data

**Client:**
- \`npm run dev\` - Start frontend dev server
- \`npm run build\` - Build production bundle
- \`npm run preview\` - Preview production build

## Database Migration

When switching databases or deploying:

1. Set \`DATABASE_URL\` to your database connection string
2. Run \`npm run db:migrate\` - Automatically detects and uses correct migrations
3. Run \`npm run db:seed\` - Populate initial data (optional)

The system automatically:
- Detects database type from \`DATABASE_URL\` protocol
- Uses appropriate SQL dialect
- Runs correct migration files (postgres/ or mysql/)

## Troubleshooting

### Port Already in Use
\`\`\`bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

### Database Connection Errors
- Verify \`DATABASE_URL\` format is correct
- Check database server is running
- Confirm credentials are valid
- Ensure database exists

### Migration Errors
- Check database user has CREATE privileges
- Verify schema files match expected dialect
- Review migration SQL in drizzle/postgres/ or drizzle/mysql/

### MySQL VARCHAR Length Errors
MySQL limits VARCHAR to ~16,383 characters. Long text fields automatically use TEXT type.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (both PostgreSQL and MySQL if affecting database)
5. Submit a pull request

## Support

For issues and questions:
- Open an issue on GitHub
- Check documentation in \`/deploy\` directory
- Review CLAUDE.md for development guidelines

## Changelog

### Version 1.1.0 (Current)
- ✨ Added MySQL/MariaDB support as PostgreSQL alternative
- ✨ Database auto-detection from DATABASE_URL protocol
- ✨ Dual schema architecture (postgres/ and mysql/)
- ✨ Database-agnostic seeding with conflict handling
- ✨ Pure Node.js backup for both databases
- 🔧 Updated deployment scripts with database selection
- 📚 Enhanced documentation

### Version 1.0.0
- Initial release with PostgreSQL support
- Server inventory management
- Application tracking
- Backup system
- Role-based access control
