import { GraphQLError } from 'graphql';

/**
 * Typed `GraphQLError` helpers used by every resolver so clients get a
 * consistent `extensions.code` (and matching HTTP status) to branch on,
 * instead of ad-hoc error shapes scattered across the schema.
 */

export function unauthenticated(
  message = 'You must be signed in to perform this action.'
): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
  });
}

export function forbidden(
  message = 'You do not have permission to perform this action.'
): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN', http: { status: 403 } },
  });
}

export function badInput(
  message = 'The provided input is invalid.',
  details?: Record<string, unknown>
): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: 'BAD_USER_INPUT',
      http: { status: 400 },
      ...(details ? { details } : {}),
    },
  });
}

export function notFound(entity = 'Resource', message?: string): GraphQLError {
  return new GraphQLError(message ?? `${entity} not found.`, {
    extensions: { code: 'NOT_FOUND', http: { status: 404 } },
  });
}
