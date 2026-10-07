import { eq } from 'drizzle-orm';
import { Webhook } from 'svix';
import type { Database } from '../db';
import { users } from '../db/schema';
import {
  type Env,
  MOCK_CLERK_WEBHOOK_SECRET,
  isClerkWebhookConfigured,
  isDevelopment,
} from '../lib/env';

interface ClerkEmailAddress {
  email_address: string;
}

interface ClerkUserEventData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
}

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string;
  data: ClerkUserEventData;
}

function fullName(data: ClerkUserEventData): string | null {
  const parts = [data.first_name, data.last_name].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(' ') : null;
}

/**
 * Verifies the Svix signature Clerk attaches to every webhook delivery.
 *
 * Clerk is not connected to a real account yet in local development: when
 * `CLERK_WEBHOOK_SECRET` is unset/mocked and `ENVIRONMENT=development`,
 * signature verification is skipped so the endpoint can be exercised with a
 * hand-crafted payload (e.g. via curl) while offline. In any other
 * environment a missing/invalid secret is a hard failure.
 */
async function verifyClerkWebhook(request: Request, env: Env): Promise<ClerkWebhookEvent> {
  const payload = await request.text();

  if (!isClerkWebhookConfigured(env)) {
    if (!isDevelopment(env)) {
      throw new Error('CLERK_WEBHOOK_SECRET is not configured.');
    }
    return JSON.parse(payload) as ClerkWebhookEvent;
  }

  const svixHeaders = {
    'svix-id': request.headers.get('svix-id') ?? '',
    'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
    'svix-signature': request.headers.get('svix-signature') ?? '',
  };

  const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET ?? MOCK_CLERK_WEBHOOK_SECRET);
  // `verify` throws on an invalid signature and otherwise returns void; it no
  // longer hands back the parsed body, so parse it ourselves once verified.
  webhook.verify(payload, svixHeaders);
  return JSON.parse(payload) as ClerkWebhookEvent;
}

export async function handleClerkWebhook(
  request: Request,
  env: Env,
  db: Database
): Promise<Response> {
  let event: ClerkWebhookEvent;
  try {
    event = await verifyClerkWebhook(request, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook payload.';
    return new Response(`Webhook verification failed: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const email = event.data.email_addresses?.[0]?.email_address;
      if (!email) {
        return new Response('Missing email address on Clerk user event.', { status: 400 });
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, event.data.id));

      if (existing) {
        await db
          .update(users)
          .set({
            email,
            name: fullName(event.data) ?? existing.name,
            avatarUrl: event.data.image_url ?? existing.avatarUrl,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, existing.id));
      } else {
        await db.insert(users).values({
          clerkUserId: event.data.id,
          email,
          name: fullName(event.data),
          avatarUrl: event.data.image_url ?? null,
        });
      }

      return new Response('ok', { status: 200 });
    }

    case 'user.deleted': {
      await db.delete(users).where(eq(users.clerkUserId, event.data.id));
      return new Response('ok', { status: 200 });
    }

    default:
      return new Response('ignored', { status: 200 });
  }
}
