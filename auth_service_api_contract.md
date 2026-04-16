# Auth Service API Contract
## Production-Ready API Specification for Reusable OTP Authentication Service

This document defines the **strict API contract** for a reusable **OTP-based Authentication Service** that can be used by multiple internal applications now and may later be offered as a paid API service.

This auth service is API-first and should be designed as a standalone backend service.

It must support:
- OTP send/verify flows
- email delivery now for testing
- SMS delivery later for production
- multi-app support
- JWT access/refresh tokens
- identity verification flows
- reusable delivery provider abstraction
- strong validation and rate limiting

This document is meant to be given directly to an AI coding agent or developer.

---

# 1. GLOBAL API CONVENTIONS

## 1.1 Base URL
Example:
- `/api/v1`

## 1.2 Authentication Types
This service has two kinds of auth:

### A. App-level access
Used by client apps calling the auth service.
This can be implemented using one of these methods:
- `x-app-id`
- `x-app-key`
- signed internal access token

For MVP and internal usage, use:
- `x-app-id`
- `x-app-key`

### B. User-level access
Used after user authentication.
Use:
- `Authorization: Bearer <access_token>`

---

## 1.3 Standard Response Format
### Success
```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": []
}
```

---

## 1.4 Status Codes
Use standard HTTP status codes:
- `200 OK`
- `201 Created`
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `422 Unprocessable Entity`
- `429 Too Many Requests`
- `500 Internal Server Error`

---

# 2. SERVICE PURPOSE AND DESIGN RULES

## 2.1 Primary Purpose
The auth service should provide reusable authentication and identity verification APIs for multiple apps such as:
- ride booking app
- social media app
- future apps

## 2.2 Important Design Rules
- do not couple OTP logic to one delivery provider
- do not couple OTP logic only to email or only to SMS
- support delivery channels as configurable modes
- support `app_id` / app-level config
- keep identity verification generic
- keep OTP core separate from app-specific business logic

## 2.3 Current Testing Phase Rule
During current development/testing:
- use **email OTP delivery**
- keep architecture ready for **SMS OTP** later

---

# 3. CORE ENTITIES

The auth service should conceptually manage these entities:
- apps
- app_configs
- identities
- otp_codes
- refresh_tokens
- audit_logs

## 3.1 apps
Represents a client app using the auth service.

Suggested fields:
- id
- app_id
- name
- app_key_hash
- status
- created_at
- updated_at

## 3.2 app_configs
Per-app configuration.

Suggested fields:
- id
- app_id
- default_target_type
- otp_expiry_minutes
- resend_cooldown_seconds
- max_attempts
- max_requests_per_hour_per_target
- max_requests_per_hour_per_ip
- active_channel
- email_provider
- sms_provider
- access_token_ttl_minutes
- refresh_token_ttl_days

## 3.3 identities
Represents a verified or unverified identity in the system.

Suggested fields:
- id
- app_id
- identity_type (`email`, `phone`)
- identity_value
- is_verified
- metadata_json
- created_at
- updated_at

## 3.4 otp_codes
Stores OTP records.

Suggested fields:
- id
- app_id
- target_type
- target_value
- purpose
- otp_hash
- expires_at
- attempts
- max_attempts
- resend_count
- is_used
- created_at
- used_at
- ip_address
- device_id

## 3.5 refresh_tokens
Stores refresh tokens.

Suggested fields:
- id
- app_id
- identity_id
- token_hash
- expires_at
- is_revoked
- created_at
- revoked_at
- device_id

## 3.6 audit_logs
Stores security and auth events.

Suggested fields:
- id
- app_id
- event_type
- target_type
- target_value
- ip_address
- device_id
- status
- message
- created_at

---

# 4. APP AUTHENTICATION AND VALIDATION

Every app request must include app-level identity.

## Required Headers
```http
x-app-id: ride_app
x-app-key: some-secret-key
```

## App validation rules
- app must exist
- app must be active
- app key must match securely
- app config must be loaded before auth logic executes

## Error response: invalid app credentials
```json
{
  "success": false,
  "message": "Invalid application credentials",
  "errors": [
    {
      "code": "APP_AUTH_INVALID"
    }
  ]
}
```

---

# 5. OTP RULES

Default recommended rules:
- OTP length: 6 digits
- OTP expiry: 5 minutes
- resend cooldown: 60 seconds
- max attempts: 5
- max requests per target per hour: 5
- max requests per IP per hour: 10
- max resend count per active OTP flow: 3

These should be overridable via app config.

---

# 6. OTP DELIVERY CHANNELS

The auth service must support channel-based OTP delivery.

## Channels
- `email`
- `sms`
- `mock`

## Provider examples
### Email providers
- resend
- smtp
- mock

### SMS providers
- msg91
- fast2sms
- mock

The active channel/provider must be selected by app config and environment settings.

---

# 7. AUTH / OTP API CONTRACT

# 7.1 POST /otp/send
Purpose:
- send an OTP for a target identity

Authentication:
- app-level auth required

## Request body
```json
{
  "target_type": "email",
  "target_value": "user@example.com",
  "purpose": "login",
  "device_id": "device-123",
  "metadata": {
    "source": "ride_app"
  }
}
```

## Validation rules
- `target_type` required, enum: `email`, `phone`
- `target_value` required
- email must be valid if `target_type=email`
- phone must be valid if `target_type=phone`
- `purpose` required, enum examples:
  - `login`
  - `signup`
  - `verify_identity`
  - `reset`
- `device_id` optional
- `metadata` optional

## Business rules
- validate app
- load app config
- normalize target value
- apply target rate limit
- apply IP rate limit
- enforce resend cooldown
- generate OTP
- hash OTP
- insert OTP row
- send via configured delivery channel/provider
- write audit log

## Success response
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "target_type": "email",
    "target_value_masked": "u***@example.com",
    "purpose": "login",
    "retry_after_seconds": 60,
    "delivery_channel": "email"
  }
}
```

## Error response: invalid target
```json
{
  "success": false,
  "message": "Invalid target value",
  "errors": [
    {
      "field": "target_value",
      "code": "TARGET_INVALID"
    }
  ]
}
```

## Error response: cooldown active
```json
{
  "success": false,
  "message": "Please wait before requesting another OTP",
  "errors": [
    {
      "field": "target_value",
      "code": "OTP_COOLDOWN_ACTIVE"
    }
  ]
}
```

## Error response: too many requests
```json
{
  "success": false,
  "message": "Too many OTP requests. Please try again later.",
  "errors": [
    {
      "code": "OTP_RATE_LIMIT_EXCEEDED"
    }
  ]
}
```

---

# 7.2 POST /otp/verify
Purpose:
- verify OTP for target identity
- create or update identity verification state
- issue auth tokens if login/signup flow requires it

Authentication:
- app-level auth required

## Request body
```json
{
  "target_type": "email",
  "target_value": "user@example.com",
  "otp": "123456",
  "purpose": "login",
  "device_id": "device-123"
}
```

## Validation rules
- `target_type` required
- `target_value` required
- `otp` required, 6-digit string
- `purpose` required

## Business rules
- validate app
- fetch latest active OTP row for app + target + purpose
- reject if not found
- reject if expired
- reject if already used
- reject if max attempts exceeded
- increment attempt count before or during validation flow
- compare submitted OTP against stored hash
- if invalid, return error and log attempt
- if valid:
  - mark OTP used
  - create identity if it does not exist
  - mark identity verified
  - create access token
  - create refresh token
  - write audit log

## Success response
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "identity": {
      "id": "uuid",
      "app_id": "ride_app",
      "identity_type": "email",
      "identity_value": "user@example.com",
      "is_verified": true
    },
    "access_token": "jwt-access-token",
    "refresh_token": "jwt-refresh-token",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

## Error response: invalid OTP
```json
{
  "success": false,
  "message": "Invalid OTP",
  "errors": [
    {
      "field": "otp",
      "code": "OTP_INVALID"
    }
  ]
}
```

## Error response: expired OTP
```json
{
  "success": false,
  "message": "OTP has expired",
  "errors": [
    {
      "field": "otp",
      "code": "OTP_EXPIRED"
    }
  ]
}
```

## Error response: attempts exceeded
```json
{
  "success": false,
  "message": "Maximum OTP attempts exceeded",
  "errors": [
    {
      "field": "otp",
      "code": "OTP_MAX_ATTEMPTS_EXCEEDED"
    }
  ]
}
```

---

# 7.3 POST /otp/resend
Purpose:
- resend OTP if cooldown allows

Authentication:
- app-level auth required

## Request body
```json
{
  "target_type": "email",
  "target_value": "user@example.com",
  "purpose": "login",
  "device_id": "device-123"
}
```

## Business rules
- validate app
- check active OTP flow
- enforce resend cooldown
- enforce resend count limit
- create/send new OTP or resend according to implementation policy
- write audit log

## Success response
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "retry_after_seconds": 60
  }
}
```

## Error response: resend limit
```json
{
  "success": false,
  "message": "Maximum resend attempts reached",
  "errors": [
    {
      "code": "OTP_RESEND_LIMIT_EXCEEDED"
    }
  ]
}
```

---

# 7.4 POST /auth/refresh
Purpose:
- refresh access token using refresh token

Authentication:
- app-level auth required

## Request body
```json
{
  "refresh_token": "jwt-refresh-token",
  "device_id": "device-123"
}
```

## Business rules
- validate app
- verify refresh token format
- locate hashed token record
- reject if missing, revoked, or expired
- optionally rotate refresh token
- return new access token

## Success response
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "new-access-token",
    "refresh_token": "new-refresh-token",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

## Error response
```json
{
  "success": false,
  "message": "Invalid or expired refresh token",
  "errors": [
    {
      "code": "REFRESH_TOKEN_INVALID"
    }
  ]
}
```

---

# 7.5 POST /auth/logout
Purpose:
- revoke refresh token

Authentication:
- app-level auth required

## Request body
```json
{
  "refresh_token": "jwt-refresh-token",
  "device_id": "device-123"
}
```

## Business rules
- validate app
- locate refresh token record
- mark revoked
- write audit log

## Success response
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

---

# 7.6 POST /auth/logout-all
Purpose:
- revoke all refresh tokens for a verified identity inside a given app

Authentication:
- user-level access token required
- app-level auth required

## Request body
```json
{
  "identity_id": "uuid"
}
```

## Business rules
- caller must be authenticated
- identity must belong to same app context
- revoke all tokens for that identity
- write audit log

## Success response
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": {}
}
```

---

# 8. IDENTITY API CONTRACT

# 8.1 GET /identities/me
Purpose:
- fetch the currently authenticated identity profile

Authentication:
- user-level access token required
- app-level auth required

## Success response
```json
{
  "success": true,
  "message": "Identity fetched successfully",
  "data": {
    "id": "uuid",
    "app_id": "ride_app",
    "identity_type": "email",
    "identity_value": "user@example.com",
    "is_verified": true,
    "metadata": {}
  }
}
```

---

# 8.2 POST /identities/verify-contact
Purpose:
- generic endpoint to start verifying a new contact method
- useful later for add-phone, add-email, change-email, etc.

Authentication:
- user-level access token required
- app-level auth required

## Request body
```json
{
  "target_type": "phone",
  "target_value": "+919876543210",
  "purpose": "verify_identity"
}
```

## Behavior
- internally triggers OTP send flow
- can reuse `/otp/send` logic

---

# 8.3 GET /identities/:identityId
Purpose:
- fetch identity by ID

Authentication:
- app-level auth required
- internal/admin access only or restricted scope

---

# 9. APP MANAGEMENT API CONTRACT

These APIs are for internal/admin usage, not public app clients by default.

# 9.1 POST /apps
Purpose:
- create a new client app in auth service

Authentication:
- internal admin auth required

## Request body
```json
{
  "app_id": "ride_app",
  "name": "Ride Booking App",
  "status": "active"
}
```

## Success response
```json
{
  "success": true,
  "message": "App created successfully",
  "data": {
    "id": "uuid",
    "app_id": "ride_app",
    "name": "Ride Booking App",
    "status": "active"
  }
}
```

---

# 9.2 GET /apps/:appId
Purpose:
- fetch app details

Authentication:
- internal admin auth required

---

# 9.3 PATCH /apps/:appId
Purpose:
- update app details or activate/deactivate app

Authentication:
- internal admin auth required

## Request body
```json
{
  "status": "inactive"
}
```

---

# 9.4 PATCH /apps/:appId/config
Purpose:
- update app-specific auth rules

Authentication:
- internal admin auth required

## Request body
```json
{
  "default_target_type": "email",
  "otp_expiry_minutes": 5,
  "resend_cooldown_seconds": 60,
  "max_attempts": 5,
  "max_requests_per_hour_per_target": 5,
  "max_requests_per_hour_per_ip": 10,
  "active_channel": "email",
  "email_provider": "resend",
  "sms_provider": "msg91",
  "access_token_ttl_minutes": 15,
  "refresh_token_ttl_days": 30
}
```

---

# 10. INTERNAL / OPS API CONTRACT

# 10.1 GET /health
Purpose:
- health check endpoint

Authentication:
- public or internal depending deployment

## Success response
```json
{
  "success": true,
  "message": "Service healthy",
  "data": {
    "status": "ok"
  }
}
```

---

# 10.2 GET /metrics
Purpose:
- internal metrics endpoint

Authentication:
- internal only

---

# 10.3 GET /audit-logs
Purpose:
- fetch auth/audit activity logs

Authentication:
- internal admin auth required

## Query params
- `app_id`
- `target_type`
- `target_value`
- `event_type`
- `status`
- `from`
- `to`
- `page`
- `limit`

---

# 11. DELIVERY PROVIDER ARCHITECTURE RULES

The API contract assumes delivery is abstracted.

## Required internal interface
```js
sendOtp({
  appId,
  targetType,
  targetValue,
  otp,
  subject,
  message,
  templateData
})
```

## Channel behavior
### Email now
- use email channel in testing
- provider example: resend or smtp

### SMS later
- use sms channel in production
- provider examples: msg91, fast2sms

### Mock
- dev/testing only

The delivery mechanism must not change endpoint contracts.

---

# 12. TOKEN CONTRACT RULES

## Access token
- JWT
- short-lived
- include:
  - identity_id
  - app_id
  - identity_type
  - identity_value

## Refresh token
- longer-lived
- stored hashed in DB
- revocable
- device-aware if possible

---

# 13. ERROR CODE CATALOG

Use clear machine-readable error codes.

## App auth errors
- `APP_AUTH_INVALID`
- `APP_INACTIVE`
- `APP_CONFIG_MISSING`

## OTP errors
- `TARGET_INVALID`
- `OTP_COOLDOWN_ACTIVE`
- `OTP_RATE_LIMIT_EXCEEDED`
- `OTP_INVALID`
- `OTP_EXPIRED`
- `OTP_MAX_ATTEMPTS_EXCEEDED`
- `OTP_RESEND_LIMIT_EXCEEDED`
- `OTP_NOT_FOUND`

## Token/session errors
- `REFRESH_TOKEN_INVALID`
- `REFRESH_TOKEN_REVOKED`
- `ACCESS_TOKEN_INVALID`
- `ACCESS_TOKEN_EXPIRED`

## Identity errors
- `IDENTITY_NOT_FOUND`
- `IDENTITY_NOT_VERIFIED`
- `IDENTITY_ALREADY_EXISTS`

## Delivery errors
- `DELIVERY_PROVIDER_UNAVAILABLE`
- `DELIVERY_FAILED`

---

# 14. SECURITY AND VALIDATION RULES

The implementation must enforce:
- app-level credential validation
- target normalization
- rate limiting by target and IP
- resend cooldown
- OTP hashing
- refresh token hashing
- audit logging
- no OTP leakage in production responses
- no OTP logging in production
- provider abstraction

---

# 15. DEVELOPMENT MODE RULES

For the current phase, support development mode.

## Development behavior
- active channel may be `email` or `mock`
- email OTP may be used for testing
- optional console OTP logging in dev only
- test accounts may use fixed OTP if configured

## Production behavior
- no OTP in logs or API responses
- live delivery provider required
- strict error handling if provider missing

---

# 16. NOTES FOR AI AGENT
- Build this as a standalone auth-service
- Keep OTP core separate from delivery providers
- Keep identity model generic and reusable across apps
- Keep app/client validation separate from user auth tokens
- Implement this contract as actual API design target, not pseudo-doc only
- Use route/controller/service/repository or similarly modular architecture
- Make the service reusable across multiple products

---

# 17. FINAL GOAL
Use this API contract to build a reusable OTP authentication service that:
- supports multiple apps
- uses email OTP now and SMS later
- has predictable endpoint structures
- can be integrated cleanly into all your projects
- can later evolve into a paid auth API service

