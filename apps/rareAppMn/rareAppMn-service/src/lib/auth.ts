import { verifyToken } from '@clerk/backend';
import {
  type Env,
  MOCK_CLERK_SECRET_KEY,
  getAdminClerkUserIds,
  isClerkSecretConfigured,
  isDevelopment,
} from './env';

export type UserRole = 'admin' | 'student';

export interface AuthenticatedUser {
  clerkUserId: string;
  role: UserRole;
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') return null;
  return token;
}

function roleFor(clerkUserId: string, env: Env): UserRole {
  return getAdminClerkUserIds(env).includes(clerkUserId) ? 'admin' : 'student';
}

/**
 * Resolves the caller's identity for the current request.
 *
 * Clerk is not connected to a real account yet in local development: when
 * `CLERK_SECRET_KEY` is unset/mocked and `ENVIRONMENT=development`, the
 * bearer token (or the first configured admin id) is trusted as-is so the
 * GraphQL API remains testable offline. In any other environment, an
 * unconfigured Clerk secret means every request is treated as anonymous.
 */
export async function getAuthenticatedUser(
  request: Request,
  env: Env
): Promise<AuthenticatedUser | null> {
  const token = extractBearerToken(request);

  if (!isClerkSecretConfigured(env)) {
    if (!isDevelopment(env)) return null;

    const devClerkUserId = token ?? getAdminClerkUserIds(env)[0];
    if (!devClerkUserId) return null;
    return { clerkUserId: devClerkUserId, role: roleFor(devClerkUserId, env) };
  }

  if (!token) return null;

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY ?? MOCK_CLERK_SECRET_KEY,
    });
    return { clerkUserId: payload.sub, role: roleFor(payload.sub, env) };
  } catch {
    return null;
  }
}
