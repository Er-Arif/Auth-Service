CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "apps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "app_key_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" TEXT NOT NULL,
    "default_target_type" TEXT NOT NULL,
    "otp_expiry_minutes" INTEGER NOT NULL,
    "resend_cooldown_seconds" INTEGER NOT NULL,
    "max_attempts" INTEGER NOT NULL,
    "max_requests_per_hour_per_target" INTEGER NOT NULL,
    "max_requests_per_hour_per_ip" INTEGER NOT NULL,
    "max_resend_count" INTEGER NOT NULL DEFAULT 3,
    "active_channel" TEXT NOT NULL,
    "email_provider" TEXT NOT NULL,
    "sms_provider" TEXT NOT NULL,
    "access_token_ttl_minutes" INTEGER NOT NULL,
    "refresh_token_ttl_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "identities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" TEXT NOT NULL,
    "identity_type" TEXT NOT NULL,
    "identity_value" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_value" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL,
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "device_id" TEXT,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" TEXT NOT NULL,
    "identity_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "device_id" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "target_type" TEXT,
    "target_value" TEXT,
    "ip_address" TEXT,
    "device_id" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "apps_app_id_key" ON "apps"("app_id");
CREATE UNIQUE INDEX "app_configs_app_id_key" ON "app_configs"("app_id");
CREATE UNIQUE INDEX "identities_app_id_identity_type_identity_value_key" ON "identities"("app_id", "identity_type", "identity_value");
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX "idx_identities_lookup" ON "identities"("app_id", "identity_type", "identity_value");
CREATE INDEX "idx_otp_lookup" ON "otp_codes"("app_id", "target_type", "target_value", "purpose", "is_used", "expires_at", "created_at");
CREATE INDEX "idx_refresh_token_identity_lookup" ON "refresh_tokens"("app_id", "identity_id", "is_revoked", "expires_at");
CREATE INDEX "idx_audit_logs_filter" ON "audit_logs"("app_id", "event_type", "status", "created_at");
CREATE INDEX "idx_audit_logs_target_filter" ON "audit_logs"("app_id", "target_type", "target_value", "created_at");

ALTER TABLE "app_configs"
ADD CONSTRAINT "app_configs_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "identities"
ADD CONSTRAINT "identities_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "otp_codes"
ADD CONSTRAINT "otp_codes_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
ADD CONSTRAINT "refresh_tokens_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens"
ADD CONSTRAINT "refresh_tokens_identity_id_fkey"
FOREIGN KEY ("identity_id") REFERENCES "identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("app_id") ON DELETE CASCADE ON UPDATE CASCADE;
