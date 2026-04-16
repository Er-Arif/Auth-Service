# Integration Guide

## Base path

`/api/v1`

## App authentication headers

Every app-facing request must include:

```http
x-app-id: ride_app
x-app-key: ride_app_secret_123
```

Authenticated identity routes also require:

```http
Authorization: Bearer <access_token>
```

Admin routes require:

```http
x-internal-admin-key: <INTERNAL_ADMIN_KEY>
```

## Example flow

### 1. Send OTP

```http
POST /api/v1/otp/send
Content-Type: application/json
x-app-id: ride_app
x-app-key: ride_app_secret_123
```

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

### 2. Verify OTP

```http
POST /api/v1/otp/verify
Content-Type: application/json
x-app-id: ride_app
x-app-key: ride_app_secret_123
```

```json
{
  "target_type": "email",
  "target_value": "user@example.com",
  "otp": "123456",
  "purpose": "login",
  "device_id": "device-123"
}
```

### 3. Refresh tokens

```http
POST /api/v1/auth/refresh
Content-Type: application/json
x-app-id: ride_app
x-app-key: ride_app_secret_123
```

```json
{
  "refresh_token": "<refresh_token>",
  "device_id": "device-123"
}
```

### 4. Logout

```http
POST /api/v1/auth/logout
Content-Type: application/json
x-app-id: ride_app
x-app-key: ride_app_secret_123
```

```json
{
  "refresh_token": "<refresh_token>",
  "device_id": "device-123"
}
```

### 5. Logout all devices

```http
POST /api/v1/auth/logout-all
Content-Type: application/json
x-app-id: ride_app
x-app-key: ride_app_secret_123
Authorization: Bearer <access_token>
```

```json
{
  "identity_id": "<identity_uuid>"
}
```

## Development notes

- If app config uses `mock` delivery and `ENABLE_DEV_OTP_LOG=true`, OTP values are logged only in development.
- OTP values are never returned in API responses.
- `cmd /c npm run openapi:generate` produces `openapi.json` for future API documentation tooling.
