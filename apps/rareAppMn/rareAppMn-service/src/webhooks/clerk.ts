import { eq } from 'drizzle-orm';
import { Webhook } from 'svix';
import type { Database } from '../db';
import { users } from '../db/schema';
import { roleFor } from '../lib/auth';
import { type Env, getClerkWebhookSecret, isLocalDevelopment } from '../lib/env';
import { isPlainObject, isUniqueConstraintError } from '../lib/validate';

interface ClerkEmailAddress {
  id?: string;
  email_address?: string;
}

interface ClerkUserEventData {
  id?: unknown;
  email_addresses?: unknown;
  primary_email_address_id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  image_url?: unknown;
}

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string;
  data: ClerkUserEventData;
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function fullName(data: ClerkUserEventData): string | null {
  const parts = [nonEmptyString(data.first_name), nonEmptyString(data.last_name)].filter(
    (part): part is string => part !== null
  );
  return parts.length ? parts.join(' ') : null;
}

function primaryEmail(data: ClerkUserEventData): string | null {
  const addresses = Array.isArray(data.email_addresses)
    ? data.email_addresses.filter((address): address is ClerkEmailAddress => isPlainObject(address))
    : [];
  const primary =
    addresses.find((address) => address.id === data.primary_email_address_id) ?? addresses[0];
  return nonEmptyString(primary?.email_address);
}

function parseEvent(payload: string): ClerkWebhookEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed) || typeof parsed['type'] !== 'string' || !isPlainObject(parsed['data'])) {
    return null;
  }
  return { type: parsed['type'], data: parsed['data'] };
}

function svixHeaders(request: Request) {
  return {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  };
}

async function applyEvent(event: ClerkWebhookEvent, env: Env, db: Database): Promise<Response> {
  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const clerkUserId = nonEmptyString(event.data.id);
      if (!clerkUserId) return new Response('Missing user id on Clerk user event.', { status: 400 });

      const email = primaryEmail(event.data);
      if (!email) return new Response('ignored: Clerk user has no email address', { status: 200 });

      const name = fullName(event.data);
      const avatarUrl = nonEmptyString(event.data.image_url);
      const role = roleFor(clerkUserId, env);

      await db
        .insert(users)
        .values({ clerkUserId, email, name, avatarUrl, role })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: {
            email,
            role,
            ...(name !== null ? { name } : {}),
            ...(avatarUrl !== null ? { avatarUrl } : {}),
            updatedAt: new Date().toISOString(),
          },
        });

      return new Response('ok', { status: 200 });
    }

    case 'user.deleted': {
      const clerkUserId = nonEmptyString(event.data.id);
      if (!clerkUserId) return new Response('Missing user id on Clerk user event.', { status: 400 });
      await db.delete(users).where(eq(users.clerkUserId, clerkUserId));
      return new Response('ok', { status: 200 });
    }

    default:
      return new Response('ignored', { status: 200 });
  }
}

/**
 * Verifies the Svix signature Clerk attaches to every webhook delivery.
 *
 * Clerk is not connected to a real account yet in local development: when
 * `CLERK_WEBHOOK_SECRET` is unset/mocked, `ENVIRONMENT=development`, and the
 * request is served from localhost, signature verification is skipped so the
 * endpoint can be exercised with a hand-crafted payload (e.g. via curl) while
 * offline. In any other case a missing/invalid secret is a hard failure.
 */
export async function handleClerkWebhook(
  request: Request,
  env: Env,
  db: Database
): Promise<Response> {
  const secret = getClerkWebhookSecret(env);
  if (!secret && !isLocalDevelopment(env, request)) {
    console.error('Clerk webhook received but CLERK_WEBHOOK_SECRET is not configured.');
    return new Response('Webhook endpoint is not configured.', { status: 503 });
  }

  const payload = await request.text();

  if (secret) {
    const webhook = new Webhook(secret);
    try {
      webhook.verify(payload, svixHeaders(request));
    } catch {
      return new Response('Invalid webhook signature.', { status: 400 });
    }
  }

  const event = parseEvent(payload);
  if (!event) return new Response('Invalid webhook payload.', { status: 400 });

  try {
    return await applyEvent(event, env, db);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return new Response('Conflicting user data, retry later.', { status: 409 });
    }
    console.error('Failed to process Clerk webhook.', error);
    return new Response('Failed to process webhook.', { status: 500 });
  }
}
