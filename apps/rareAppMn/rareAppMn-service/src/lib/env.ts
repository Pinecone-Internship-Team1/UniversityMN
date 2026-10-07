/**
 * Worker bindings and environment variables for rareAppMn-service.
 *
 * Cloudflare D1 and Clerk are not yet connected to real cloud accounts for
 * local development. The MOCK_* constants below are deliberately-invalid
 * placeholder values: when a secret equals its mock value (or is unset), the
 * code that consumes it falls back to permissive local-dev behavior instead
 * of throwing, so the Worker still runs offline via `wrangler dev`.
 */

export interface Env {
  /** D1 binding, configured in wrangler.jsonc. */
  DB: D1Database;
  /** Clerk Backend API secret key (`sk_live_...` / `sk_test_...`). */
  CLERK_SECRET_KEY?: string;
  /** Svix signing secret for the Clerk webhook endpoint (`whsec_...`). */
  CLERK_WEBHOOK_SECRET?: string;
  /** Comma-separated Clerk user IDs that should be granted the admin role. */
  ADMIN_CLERK_USER_IDS?: string;
  /** Comma-separated list of origins allowed to call the GraphQL API. */
  ALLOWED_ORIGINS?: string;
  /** `development` | `staging` | `production`. Defaults to `development`. */
  ENVIRONMENT?: string;
}

export const MOCK_CLERK_SECRET_KEY = 'sk_test_mock_local_dev_only';
export const MOCK_CLERK_WEBHOOK_SECRET = 'whsec_mock_local_dev_only';
export const MOCK_ADMIN_CLERK_USER_ID = 'user_mock_admin_local_dev';
export const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:4000'];

export function isDevelopment(env: Env): boolean {
  return (env.ENVIRONMENT ?? 'development') !== 'production';
}

/** True once a real Clerk secret key has been configured (via `.dev.vars` / `wrangler secret`). */
export function isClerkSecretConfigured(env: Env): boolean {
  const key = env.CLERK_SECRET_KEY;
  if (!key) return false;
  return key !== MOCK_CLERK_SECRET_KEY && key.startsWith('sk_');
}

/** True once a real Svix webhook signing secret has been configured. */
export function isClerkWebhookConfigured(env: Env): boolean {
  const secret = env.CLERK_WEBHOOK_SECRET;
  if (!secret) return false;
  return secret !== MOCK_CLERK_WEBHOOK_SECRET && secret.startsWith('whsec_');
}

export function getAdminClerkUserIds(env: Env): string[] {
  const raw = env.ADMIN_CLERK_USER_IDS ?? MOCK_ADMIN_CLERK_USER_ID;
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function getAllowedOrigins(env: Env): string[] {
  const raw = env.ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length ? origins : DEFAULT_ALLOWED_ORIGINS;
}
