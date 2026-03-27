# ServerInv Developer Guide

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| State management | Zustand (auth + theme), TanStack React Query (server state) |
| Forms | React Hook Form + Zod validation |
| Tables | TanStack React Table |
| Routing | React Router v7 |
| Backend | Node.js, Express 4, TypeScript |
| Database | PostgreSQL 16 or MySQL 8+/MariaDB 10+, Drizzle ORM |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Backup | Browser download/upload (multer for file handling), database-agnostic |

## Project Structure

```
ServerInv/
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts       # Axios instance with auth interceptor
│   │   │   └── hooks.ts        # React Query hooks for all entities
│   │   ├── components/
│   │   │   ├── forms/
│   │   │   │   ├── LookupPage.tsx      # Reusable CRUD page for lookup entities
│   │   │   │   ├── ServerFormModal.tsx  # Server create/edit modal
│   │   │   │   └── WebsitesModal.tsx   # Websites management modal
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx       # Main layout with sidebar
│   │   │   │   ├── Header.tsx          # Top bar with theme toggle, user info
│   │   │   │   └── Sidebar.tsx         # Navigation sidebar
│   │   │   └── ui/
│   │   │       ├── Button.tsx          # Themed button variants
│   │   │       ├── ConfirmDialog.tsx   # Deletion confirmation
│   │   │       ├── DataTable.tsx       # Card/table toggle with sorting
│   │   │       ├── Input.tsx           # Themed text input
│   │   │       ├── Modal.tsx           # Modal dialog
│   │   │       ├── MultiSelect.tsx     # Multi-select dropdown for filters
│   │   │       ├── PageHeader.tsx      # Page title with action buttons
│   │   │       ├── Select.tsx          # Themed select dropdown
│   │   │       └── SelectWithAdd.tsx   # Select with inline add form
│   │   ├── pages/
│   │   │   ├── InventoryPage.tsx       # Main server inventory with filters
│   │   │   ├── RenewalsPage.tsx        # Renewal date tracking
│   │   │   ├── ApplicationsPage.tsx    # Applications management (many-to-many)
│   │   │   ├── WebsitesPage.tsx        # Legacy websites (one-to-many)
│   │   │   ├── ServerUrlsPage.tsx      # Server URL listing
│   │   │   ├── ServerIpsPage.tsx       # Server IP listing
│   │   │   ├── ProvidersPage.tsx       # Provider management
│   │   │   ├── CurrenciesPage.tsx      # Currency management
│   │   │   ├── CpuTypesPage.tsx        # CPU type management
│   │   │   ├── LocationsPage.tsx       # Location management
│   │   │   ├── DatacentersPage.tsx     # Datacenter management
│   │   │   ├── ServerTypesPage.tsx     # Server type management
│   │   │   ├── BillingPeriodsPage.tsx  # Billing period management
│   │   │   ├── PaymentMethodsPage.tsx  # Payment method management
│   │   │   ├── OperatingSystemsPage.tsx # OS management
│   │   │   ├── UsersPage.tsx           # User management (admin)
│   │   │   ├── BackupPage.tsx          # Backup/restore (admin)
│   │   │   └── LoginPage.tsx           # Authentication
│   │   ├── stores/
│   │   │   ├── authStore.ts            # Auth state (token, user, role)
│   │   │   └── themeStore.ts           # Theme persistence
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript interfaces
│   │   ├── App.tsx                     # Route definitions
│   │   ├── main.tsx                    # Entry point
│   │   └── index.css                   # Theme CSS custom properties
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/                     # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema/                 # Drizzle table definitions
│   │   │   │   ├── postgres/           # PostgreSQL schemas
│   │   │   │   │   ├── servers.ts
│   │   │   │   │   ├── apps.ts
│   │   │   │   │   └── ... (all tables)
│   │   │   │   ├── mysql/              # MySQL schemas
│   │   │   │   │   ├── servers.ts
│   │   │   │   │   ├── apps.ts
│   │   │   │   │   └── ... (all tables)
│   │   │   │   └── index.ts            # Auto-detects and exports correct schema
│   │   │   ├── index.ts                # Database connection pool (auto-detects type)
│   │   │   ├── utils.ts                # Database detection utilities
│   │   │   ├── migrate.ts              # Migration runner (auto-selects dialect)
│   │   │   └── seed.ts                 # Initial data seeder (database-agnostic)
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # JWT authentication + admin guard
│   │   │   ├── errorHandler.ts         # Global error handler
│   │   │   └── validate.ts             # Zod request body validation
│   │   ├── routes/
│   │   │   ├── auth.ts                 # POST /api/auth/login
│   │   │   ├── servers.ts              # CRUD /api/servers
│   │   │   ├── apps.ts                 # CRUD /api/apps
│   │   │   ├── serverApps.ts           # CRUD /api/servers/:id/apps
│   │   │   ├── websites.ts             # CRUD /api/servers/:id/websites (legacy)
│   │   │   ├── currencies.ts           # CRUD /api/currencies
│   │   │   ├── locations.ts            # CRUD /api/locations
│   │   │   ├── providers.ts            # CRUD /api/providers
│   │   │   ├── cpuTypes.ts             # CRUD /api/cpu-types
│   │   │   ├── operatingSystems.ts      # CRUD /api/os
│   │   │   ├── serverTypes.ts          # CRUD /api/server-types
│   │   │   ├── billingPeriods.ts       # CRUD /api/billing-periods
│   │   │   ├── paymentMethods.ts       # CRUD /api/payment-methods
│   │   │   ├── users.ts               # CRUD /api/users
│   │   │   └── backup.ts              # Backup config + export/restore
│   │   ├── services/                  # Business logic services
│   │   │   ├── pgBackupService.ts     # PostgreSQL backup/restore (pure Node.js)
│   │   │   └── mysqlBackupService.ts  # MySQL backup/restore (pure Node.js)
│   │   ├── utils/
│   │   │   ├── jwt.ts                 # Token sign/verify
│   │   │   └── password.ts            # bcrypt hash/compare
│   │   └── index.ts                   # Express app entry point
│   ├── drizzle/                       # Generated migration SQL
│   │   ├── postgres/                  # PostgreSQL migrations
│   │   └── mysql/                     # MySQL migrations
│   ├── drizzle.config.ts              # Drizzle config (multi-driver support)
│   └── tsconfig.json
├── deploy/
│   ├── setup.sh                       # Automated deployment script
│   ├── update.sh                      # Remote update script
│   ├── serverinv.service              # systemd unit file
│   └── serverinv.nginx                # nginx config
├── docker-compose.yml                 # Dev PostgreSQL
├── package.json                       # Workspace root
└── .env.example
```

## Local Development Setup

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL) or a local PostgreSQL 16+ / MySQL 8+ / MariaDB 10+ instance

### Steps

```bash
# Start PostgreSQL (or MySQL)
docker compose up -d

# Create environment files
cp .env.example .env
cp .env server/.env

# Edit server/.env and set DATABASE_URL:
# PostgreSQL: postgres://user:pass@localhost:5432/serverinv
# MySQL: mysql://user:pass@localhost:3306/serverinv

# Install all dependencies (workspaces)
npm install

# Generate migrations (if schema changed - runs for detected database type)
npm run db:generate

# Run migrations (auto-detects database type from DATABASE_URL)
npm run db:migrate

# Seed default data (admin user, currencies, server types, OS entries)
npm run db:seed

# Start both frontend and backend in dev mode
npm run dev
```

**Note**: The system automatically detects the database type from the `DATABASE_URL` protocol (`postgres://` or `mysql://`) and uses the appropriate schema and migrations.

- Frontend: http://localhost:5173 (Vite with HMR, proxies `/api` to backend)
- Backend: http://localhost:3000

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in dev mode |
| `npm run dev:client` | Start only the frontend |
| `npm run dev:server` | Start only the backend (with file watching) |
| `npm run build` | Build both client and server for production |
| `npm run db:generate` | Generate Drizzle migration SQL from schema changes |
| `npm run db:migrate` | Run pending database migrations |
| `npm run db:seed` | Seed the database with initial data |

## Architecture Patterns

### Frontend

**Generic CRUD with `LookupPage`**: Most attribute pages (Currencies, Providers, Locations, etc.) use the `LookupPage` component which provides:
- DataTable with card/table views
- Create/edit modal generated from a `fields` array
- Delete confirmation
- Optional `getInventoryLink` prop to add "View servers" links

**Data fetching with `useCrud` hook factory**: The `hooks.ts` file exports a `useCrud<T>()` factory that generates `list`, `create`, `update`, and `remove` hooks for any entity. All hooks use TanStack React Query with automatic cache invalidation.

**Theme system**: CSS custom properties defined in `index.css` under `@theme` (dark theme defaults) with `.light` class overrides. All components use semantic color names (`text-text-primary`, `bg-surface`, `border-border`, etc.) rather than raw Tailwind color classes. The `themeStore` manages persistence and applies the theme class (`dark` or `light`) to `<html>`. Adding new themes requires adding a new CSS class with overrides for all `--color-*` variables.

**Inventory filters**: Multi-select dropdowns backed by URL search params. Filter state is a `Record<string, Set<number>>` mapping filter keys to selected IDs. Datacenter filtering maps datacenter names back to locationIds.

### Backend

**Express route pattern**: Each entity has its own route file with standard CRUD endpoints. Mutations require admin role via `requireAdmin` middleware. Request bodies are validated with Zod schemas via the `validate` middleware.

**Authentication flow**:
1. Client POSTs username/password to `/api/auth/login`
2. Server verifies credentials, returns JWT + user object
3. Client stores JWT in Zustand (persisted to localStorage)
4. All subsequent requests include `Authorization: Bearer <token>` header
5. `authenticate` middleware verifies JWT on every protected route
6. JWTs expire after 24 hours

**Database**: Drizzle ORM with PostgreSQL. Schema is defined as TypeScript files in `server/src/db/schema/`. Migrations are generated by `drizzle-kit` and stored as SQL in `server/drizzle/`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | `fallback-secret` (insecure) |
| `PORT` | Backend server port | `3000` |

## Adding a New Entity

1. Create schema in `server/src/db/schema/newEntity.ts`
2. Export it from `server/src/db/schema/index.ts`
3. Create route in `server/src/routes/newEntity.ts`
4. Register route in `server/src/index.ts`
5. Add TypeScript interface in `client/src/types/index.ts`
6. Add hook in `client/src/api/hooks.ts` using `useCrud`
7. Create page in `client/src/pages/NewEntityPage.tsx` (use `LookupPage` for simple CRUD)
8. Add route in `client/src/App.tsx`
9. Add sidebar entry in `client/src/components/layout/Sidebar.tsx`
10. Run `npm run db:generate` then `npm run db:migrate`

## Code Style

- 2-space indentation for TypeScript/JavaScript/CSS
- No semicolons in import-heavy files (Prettier-compatible)
- Functional components with hooks
- Minimal comments; code should be self-documenting
