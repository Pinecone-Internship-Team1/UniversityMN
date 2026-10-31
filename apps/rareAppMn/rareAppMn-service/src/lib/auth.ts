import { createClerkClient, verifyToken } from '@clerk/backend';
import { isClerkAPIResponseError } from '@clerk/backend/errors';
import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { users } from '../db/schema';
import type { ClerkUserExists } from './userSync';
import {
  type Env,
  getAdminClerkUserIds,
  getAllowedOrigins,
  getClerkSecretKey,
  isLocalDevelopment,
} from './env';
import { isPlainObject } from './validate';

export type UserRole = 'admin' | 'student';

export interface AuthenticatedUser {
  clerkUserId: string;
  role: UserRole;
}

const BEARER_PATTERN = /^Bearer\s+(\S+)\s*$/i;

function extractBearerToken(header: string): string | null {
  return BEARER_PATTERN.exec(header)?.[1] ?? null;
}

function decodeUnverifiedSubject(token: string): string | null {
  const segments = token.split('.');
  if (segments.length !== 3 || !segments[1]) return null;
  try {
    const claims: unknown = JSON.parse(atob(segments[1].replace(/-/g, '+').replace(/_/g, '/')));
    const subject = isPlainObject(claims) ? claims['sub'] : null;
    return typeof subject === 'string' && subject ? subject : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the caller's Clerk user ID for the current request.
 *
 * Clerk is not connected to a real account yet in local development: when
 * `CLERK_SECRET_KEY` is unset/mocked, `ENVIRONMENT=development`, and the
 * request is served from localhost, the bearer token (or the first ID in
 * `ADMIN_CLERK_USER_IDS`) is trusted as-is so the GraphQL API remains testable
 * offline. In any other case, an unconfigured Clerk secret means every
 * request is treated as anonymous.
 */
async function getAuthenticatedClerkUserId(request: Request, env: Env): Promise<string | null> {
  const header = request.headers.get('authorization');
  const token = header ? extractBearerToken(header) : null;
  if (header && !token) return null;

  const secretKey = getClerkSecretKey(env);
  if (!secretKey) {
    if (!isLocalDevelopment(env, request)) return null;

    const devClerkUserId = token
      ? (decodeUnverifiedSubject(token) ?? token)
      : getAdminClerkUserIds(env)[0];
    return devClerkUserId ?? null;
  }

  if (!token) return null;

  try {
    const authorizedParties = getAllowedOrigins(env);
    const payload = await verifyToken(token, {
      secretKey,
      ...(authorizedParties.length ? { authorizedParties } : {}),
    });
    return payload.sub;
  } catch {
    return null;
  }
}

/**
 * Resolves the caller and their role. `users.role` in D1 is the only source
 * of the role: it is never taken from the request, Clerk metadata or env
 * vars, and Clerk syncs never write it. Callers without a row are students.
 */
export async function getAuthenticatedUser(
  request: Request,
  env: Env,
  db: Database
): Promise<AuthenticatedUser | null> {
  const clerkUserId = await getAuthenticatedClerkUserId(request, env);
  if (!clerkUserId) return null;
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return { clerkUserId, role: row?.role ?? 'student' };
}

export interface ClerkPrimaryEmail {
  address: string;
  verified: boolean;
}

export async function fetchClerkPrimaryEmail(
  clerkUserId: string,
  env: Env
): Promise<ClerkPrimaryEmail | null | undefined> {
  const secretKey = getClerkSecretKey(env);
  if (!secretKey) return undefined;
  const clerkUser = await createClerkClient({ secretKey }).users.getUser(clerkUserId);
  const primary = clerkUser.primaryEmailAddress ?? clerkUser.emailAddresses[0];
  if (!primary) return null;
  return {
    address: primary.emailAddress,
    verified: primary.verification?.status === 'verified',
  };
}

/**
 * Asks Clerk whether a user ID exists in the configured instance (a
 * test-instance ID does not exist in the live one). Any answer other than a
 * clear 404, or no Clerk secret, counts as "exists" so rows are never moved
 * on a guess.
 */
export function clerkUserExistsIn(env: Env): ClerkUserExists {
  return async (clerkUserId) => {
    const secretKey = getClerkSecretKey(env);
    if (!secretKey) return true;
    try {
      await createClerkClient({ secretKey }).users.getUser(clerkUserId);
      return true;
    } catch (error) {
      return !(isClerkAPIResponseError(error) && error.status === 404);
    }
  };
}
