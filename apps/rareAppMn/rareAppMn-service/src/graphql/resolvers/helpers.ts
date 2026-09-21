import { GraphQLError } from 'graphql';

export function notFoundError(entity: string, id: string): GraphQLError {
  return new GraphQLError(`${entity} with id "${id}" was not found.`, {
    extensions: { code: 'NOT_FOUND' },
  });
}

export function badInputError(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

export const MAX_PAGE_SIZE = 100;

/** Clamps an optional `limit` arg to a sane range, or returns undefined for "no limit". */
export function clampLimit(limit: number | null | undefined): number | undefined {
  if (limit === null || limit === undefined) return undefined;
  if (limit < 0) throw badInputError('limit must not be negative.');
  return Math.min(limit, MAX_PAGE_SIZE);
}

export function normalizeOffset(offset: number | null | undefined): number | undefined {
  if (offset === null || offset === undefined) return undefined;
  if (offset < 0) throw badInputError('offset must not be negative.');
  return offset;
}

/**
 * Runs a DB operation and turns any unexpected failure into a generic
 * GraphQL error, so raw driver/SQL errors never reach the client.
 */
export async function runSafely<T>(operation: () => Promise<T>, fallbackMessage: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    console.error(fallbackMessage, error);
    throw new GraphQLError(fallbackMessage, {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }
}
