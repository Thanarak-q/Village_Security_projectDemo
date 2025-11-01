# Village Security Platform

Village Security is an integrated platform for managing residential communities. It combines a Bun-powered API, a Next.js admin portal, and a real-time notification service to support tasks such as visitor screening, resident management, OCR-assisted ID checks, and LINE LIFF integrations. The stack is containerised with Docker and ships with Postgres, MinIO object storage, Caddy reverse proxy, and optional Ngrok exposure.

## Key Capabilities
- Visitor intake with OCR for Thai ID cards, driving licences, and licence plates.
- Role-based portals for guards, residents, admins, and super admins.
- Real-time announcements and alerts delivered through a Bun WebSocket service.
- LINE LIFF login and messaging workflows for residents.
- Media storage via MinIO with automatic bucket provisioning.
- Weekly, monthly, and yearly reporting dashboards backed by Postgres and Drizzle ORM.

## Service Topology
- **frontend**: Next.js 15 (React 19) admin & resident UI, served on `http://localhost:3000`.
- **backend**: Elysia (Bun) REST API with Drizzle ORM, exposed on `http://localhost:3001`.
- **websocket**: Bun service publishing notifications on `ws://localhost:3002/ws` by default.
- **db**: Postgres 18 storing all operational data.
- **minio**: Object storage for identification images and uploads (console on `http://localhost:9001`).
- **caddy**: Reverse proxy terminating at `http://localhost`.
- **ngrok** *(optional)*: Publishes Caddy to the internet when `NGROK_AUTHTOKEN` and `URL` are provided.

The root `.env` file feeds every service via `docker-compose.yml` as well as local Bun processes.

## Prerequisites
- Docker & Docker Compose v2
- Bun ≥ 1.0 (for local development outside Docker)
- Node.js 18+ *(recommended for editor tooling and Next.js type checking)*
- Ngrok account *(only if you need public tunnelling)*

## Getting Started
1. **Clone the repository**
   ```bash
   git clone <YOUR_FORK_URL> Village_Security_project
   cd Village_Security_project
   ```
2. **Create the root `.env` file** (see [Environment Variables](#environment-variables)).
3. **Install dependencies**
   ```bash
   bun install --frozen-lockfile --cwd backend
   bun install --frozen-lockfile --cwd frontend
   bun install --frozen-lockfile --cwd websocket
   ```
4. **Start the shared data services**
   ```bash
   docker compose -f DB/docker-compose.yml up -d
   ```
   > ℹ️ This bootstraps the shared `village_net` Docker network. If you ever need to start the app stack without this step, create it manually once via `docker network create village_net`.
5. **Start the application stack**
   ```bash
   docker compose up --build -d
   ```
   After the containers settle:
   - Frontend UI: `http://localhost`
   - API health check: `http://localhost:3001/api/health`
   - MinIO console: `http://localhost:9001` (default login `minioadmin` / `minioadmin123`)
   - Ngrok dashboard (if enabled): `http://localhost:4040`

> ⚠️ The provided `run.sh` script performs a full Docker prune before rebuilding. Use it only if you are comfortable deleting *all* local Docker images, containers, and volumes.

## Local Development (without Docker)
1. **Install dependencies**
   ```bash
   bun install --frozen-lockfile --cwd backend
   bun install --frozen-lockfile --cwd frontend
   bun install --frozen-lockfile --cwd websocket
   ```
2. **Ensure Postgres and MinIO are running**
   ```bash
   docker compose -f DB/docker-compose.yml up -d
   ```
   - Stop them when finished: `docker compose -f DB/docker-compose.yml down`
3. **Start each service**
   ```bash
   # Backend API with hot reload
   bun run dev --cwd backend

   # Websocket notifications
   bun run dev --cwd websocket

   # Next.js frontend
   bun run dev --cwd frontend
   ```
4. **Access the app**
   - Next.js dev server: `http://localhost:3000`
   - API: `http://localhost:3001`
   - WebSocket: `ws://localhost:3002/ws`

### Database migrations & seed data
- Apply schema changes: `bunx drizzle-kit push` (runs automatically in the backend Docker entrypoint).
- Seed base data: `bun run seed`
- Seed super-admin credentials: `bun run seed:superadmin`

## Environment Variables
Create a `.env` file in the repository root (also referenced by `ENV_FILE_PATH` in Docker). Use placeholder values below and replace them with project-specific secrets.

```dotenv
# Runtime can change to production
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://vill-admin:strongpassword@db:5432/village-security
POSTGRES_USER=vill-admin
POSTGRES_PASSWORD=strongpassword
POSTGRES_DB=village-security
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Auth & LINE
JWT_SECRET=replace-with-random-256bit-secret
JWT_EXPIRES_IN=7d
LINE_CHANNEL_ID=YOUR_LINE_CHANNEL_ID
LINE_MESSAGE_API=YOUR_LINE_MESSAGING_CHANNEL_ID
LINE_MESSAGE_SECRET=YOUR_LINE_CHANNEL_ACCESS_TOKEN

# OCR & external integrations from https://ai.iapp.co.th/
THAI_OCR_API_KEY=YOUR_THAI_OCR_API_KEY

# Super admin bootstrap
SUPERADMIN_USERNAME=super-admin
SUPERADMIN_EMAIL=super-admin@example.com
SUPERADMIN_PASSWORD=changeMe!1234

# Websocket
WS_PORT=3002
WS_PATH=/ws
WS_IDLE_TIMEOUT=120

# Frontend
NEXT_PUBLIC_LIFF_ID=YOUR_LIFF_ID
NEXT_PUBLIC_API_URL=http://localhost:3001

# File storage (MinIO)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=images

# Tooling & tunnelling (optional)
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
NGROK_AUTHTOKEN=
URL=my-tunnel.ngrok-free.dev

# Docker build controls (optional)
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1
BUILDKIT_PROGRESS=plain

# DOMAIN
DOMAIN=your-domain
```

### Tips
- Use `ENV_FILE=/absolute/path/to/.env` to point Docker or Bun to an alternative configuration file.
- Keep secrets out of source control; consider creating a sanitized `.env.example` for collaborators.
- `LINE_MESSAGE_SECRET` should be the channel access token from LINE Messaging API.
- `URL` must be an Ngrok domain you reserved; omit the `https://` prefix.

## Testing & Quality Checks
- Backend tests: `bun run test --cwd backend` (Vitest)
- Flex message snapshot suite: `bun run test:flex --cwd backend`
- Frontend lint: `bun run lint --cwd frontend`
- WebSocket type check: `bun run type-check --cwd websocket`

## Troubleshooting
- **API cannot connect to Postgres**  
  Ensure the `DATABASE_URL` host matches your running database (`db` inside Docker, `localhost` outside).
- **MinIO bucket errors**  
  Confirm the `MINIO_*` variables are aligned; the backend bootstraps the bucket name on startup.
- **LINE LIFF login fails locally**  
  Local LIFF apps require an HTTPS endpoint. Use Ngrok (`docker compose up ngrok`) or configure your own tunnel.
- **WebSocket disconnects**  
  Update `WS_IDLE_TIMEOUT` if clients are severed too quickly; make sure the frontend uses the same path/port.

## Repository Structure
```
├─ backend/      # Elysia API, Drizzle ORM, seeds, tests
├─ frontend/     # Next.js 15 UI with Tailwind, LIFF entry points
├─ websocket/    # Bun WebSocket service for admin notifications
├─ docker-compose.yml
├─ Caddyfile     # Reverse proxy configuration
├─ run.sh        # Optional helper script (cleans Docker, rebuilds)
└─ .env          # Environment configuration (not committed)
```

You're ready to tailor the platform for your community’s workflow. Happy building!
