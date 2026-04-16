# Architecture Notes

## Core structure

The service follows a modular backend structure:

- `routes`
- `controllers`
- `services`
- `repositories`
- `validators/schemas`

This keeps request parsing, orchestration, persistence, and domain logic separate.

## Main design decisions

- OTP core logic is isolated from delivery providers.
- Delivery is selected from app configuration and environment, not hardcoded inside auth logic.
- Validation uses centralized Zod schemas under `src/schemas`.
- Route definitions include method, path, middleware, handler, and OpenAPI-ready metadata.
- App-level authentication is handled before business logic so every app-scoped request runs with loaded app config.

## Key subsystems

### Apps

- Stores tenant app identity and hashed app keys
- Loads app configuration before OTP/auth logic executes
- Supports admin create, fetch, update, and config update flows

### OTP

- Generates 6-digit OTPs
- Hashes OTPs before persistence
- Enforces cooldown, attempt limits, resend limits, and hourly request limits
- Persists OTP records independently of delivery

### Delivery

- `smtp` provider implemented via Nodemailer
- `mock` provider implemented for development/testing
- `resend` and `sms` providers scaffolded for later work

### Auth

- Issues JWT access tokens
- Issues opaque refresh tokens
- Stores only hashed refresh tokens
- Supports refresh rotation, logout, and logout-all

### Identities

- Keeps identity data generic and app-agnostic
- Marks identities verified after successful OTP verification
- Supports authenticated identity lookup and verify-contact flow

### Audit and ops

- Records auth and security events in `audit_logs`
- Provides `GET /health`, `GET /metrics`, and `GET /audit-logs`
- Includes cron-based cleanup worker scaffold outside the API bootstrap path

## OpenAPI readiness

The current implementation does not expose Swagger UI, but it is structured so OpenAPI generation can be extended without refactoring routes:

- Shared request/response schemas live in `src/schemas`
- Route metadata is registered centrally through `src/routes/route-builder.js`
- `src/openapi/generate-openapi.js` emits an OpenAPI JSON document from those definitions

## Current deferred items

- Real SMS provider integration
- richer metrics/observability
- dashboard and billing for SaaS mode
- stronger internal admin auth beyond a static admin key
