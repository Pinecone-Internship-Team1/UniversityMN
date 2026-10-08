import { createClerkClient, verifyToken } from '@clerk/backend';
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

export function roleFor(clerkUserId: string, env: Env): UserRole {
  return getAdminClerkUserIds(env).includes(clerkUserId) ? 'admin' : 'student';
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
 * Resolves the caller's identity for the current request.
 *
 * Clerk is not connected to a real account yet in local development: when
 * `CLERK_SECRET_KEY` is unset/mocked, `ENVIRONMENT=development`, and the
 * request is served from localhost, the bearer token (or the first
 * configured admin id) is trusted as-is so the GraphQL API remains testable
 * offline. In any other case, an unconfigured Clerk secret means every
 * request is treated as anonymous.
 */
export async function getAuthenticatedUser(
  request: Request,
  env: Env
): Promise<AuthenticatedUser | null> {
  const header = request.headers.get('authorization');
  const token = header ? extractBearerToken(header) : null;
  if (header && !token) return null;

  const secretKey = getClerkSecretKey(env);
  if (!secretKey) {
    if (!isLocalDevelopment(env, request)) return null;

    const devClerkUserId = token
      ? (decodeUnverifiedSubject(token) ?? token)
      : getAdminClerkUserIds(env)[0];
    if (!devClerkUserId) return null;
    return { clerkUserId: devClerkUserId, role: roleFor(devClerkUserId, env) };
  }

  if (!token) return null;

  try {
    const authorizedParties = getAllowedOrigins(env);
    const payload = await verifyToken(token, {
      secretKey,
      ...(authorizedParties.length ? { authorizedParties } : {}),
    });
    return { clerkUserId: payload.sub, role: roleFor(payload.sub, env) };
  } catch {
    return null;
  }
}

export async function fetchClerkPrimaryEmail(
  clerkUserId: string,
  env: Env
): Promise<string | null | undefined> {
  const secretKey = getClerkSecretKey(env);
  if (!secretKey) return undefined;
  const clerkUser = await createClerkClient({ secretKey }).users.getUser(clerkUserId);
  return (
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null
  );
}
