# Auth Service

Reusable OTP authentication service built with Express, PostgreSQL, Prisma, and Zod.

## Current status

This repository is being built phase by phase from the supplied roadmap and API contract. See [docs/phase-status.md](/e:/MyProjects/Auth-Service/docs/phase-status.md) for the implementation record.

## Planned stack

- Node.js + Express
- PostgreSQL + Prisma
- Zod for validation
- Nodemailer SMTP for email OTP
- JWT access tokens + opaque hashed refresh tokens
- Optional cron worker for cleanup jobs

## Quick start

1. Copy `.env.example` to `.env`
2. Install dependencies with `cmd /c npm install`
3. Run Prisma generate and migrations
4. Seed demo apps
5. Start the API with `cmd /c npm run dev`

Detailed setup instructions are expanded as phases are completed.
