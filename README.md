# Auth Service

Reusable OTP authentication service built with Express, PostgreSQL, Prisma, and Zod.

## What is implemented

- Multi-app OTP auth service with app-level credential validation
- Email delivery abstraction with `smtp` via Nodemailer and `mock` mode for development
- Branded OTP email template with both HTML and plain text delivery
- JWT access tokens and opaque refresh tokens stored hashed in PostgreSQL
- Centralized Zod request/response schemas structured for future OpenAPI generation
- Route/controller/service/repository architecture
- Internal admin APIs for app and config management
- Audit logging, metrics, health checks, and cleanup worker scaffold

See [docs/phase-status.md](/e:/MyProjects/Auth-Service/docs/phase-status.md), [docs/architecture.md](/e:/MyProjects/Auth-Service/docs/architecture.md), and [docs/integration-guide.md](/e:/MyProjects/Auth-Service/docs/integration-guide.md) for the implementation record and usage notes.

## Folder structure

```text
auth-service/
  prisma/
    migrations/
    schema.prisma
    seed.js
  src/
    config/
    jobs/
    lib/
    middlewares/
    modules/
    openapi/
    routes/
    schemas/
    utils/
    app.js
    server.js
    worker.js
  tests/
    run-tests.js
```

## Stack

- Node.js + Express
- PostgreSQL + Prisma
- Zod for validation and future OpenAPI generation
- Nodemailer SMTP for email OTP
- JWT access tokens
- Opaque hashed refresh tokens
- `node-cron` cleanup worker
- Dockerized runtime and worker support
- ESLint + Prettier quality gates
- GitHub Actions CI pipeline

## Environment setup

1. Copy `.env.example` to `.env`
2. Update secrets and database connection
3. Install dependencies:

```powershell
cmd /c npm install
```

## Database setup

Generate Prisma client:

```powershell
cmd /c npm run prisma:generate
```

Apply migrations against PostgreSQL:

```powershell
cmd /c npm run prisma:deploy
```

Seed demo apps:

```powershell
cmd /c npm run prisma:seed
```

## Run the service

API server:

```powershell
cmd /c npm run dev
```

Cleanup worker:

```powershell
cmd /c npm run worker
```

OpenAPI JSON generation:

```powershell
cmd /c npm run openapi:generate
```

Smoke tests:

```powershell
cmd /c npm run test:smoke
```

Unit + integration tests:

```powershell
cmd /c npm test
```

Lint:

```powershell
cmd /c npm run lint
```

Format check:

```powershell
cmd /c npm run format:check
```

## Seeded demo apps

The seed creates two apps for local testing:

- `ride_app`
  Raw app key: `ride_app_secret_123`
  Status: `active`
- `social_app`
  Raw app key: `social_app_secret_123`
  Status: `inactive`

## Important notes

- OTP values are hashed before storage in all environments.
- OTP values are never returned in API responses.
- Development-only OTP logging is controlled by `ENABLE_DEV_OTP_LOG`.
- `POST /apps` returns a generated `app_key` in the response as an operational addition so newly created apps can actually authenticate.
- SMS delivery now supports MSG91 through the provider abstraction. Fill `MSG91_AUTH_KEY` and `MSG91_SMS_SENDER_ID`, then set an app config to `active_channel=sms` and `sms_provider=msg91`.
- Git history is tracked locally phase by phase; pushing to GitHub still requires a remote to be configured.

## Deployment notes

- Production startup now fails fast if insecure default secrets are left in place.
- Set `ENABLE_DEV_OTP_LOG=false` in production.
- Configure `CORS_ORIGIN` with your allowed frontend or backend origins.
- Set `TRUST_PROXY=true` when deploying behind a reverse proxy or load balancer.
- Run the API and worker as separate processes.

Docker Compose for local deployment-style testing:

```powershell
docker compose up --build
```

Containerized services included:

- `postgres`
- `mailpit`
- `auth-service`
- `worker`

CI entrypoint:

```powershell
cmd /c npm run test:ci
```
