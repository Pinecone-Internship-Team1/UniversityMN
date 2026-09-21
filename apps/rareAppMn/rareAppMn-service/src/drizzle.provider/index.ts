import { drizzle } from 'drizzle-orm/d1';

import * as schema from '../db/schema';

/**
 * D1 bindings only exist inside a Worker's per-request `env`, so unlike a
 * connection-string-based client this can't be constructed once at module
 * load time — it's built fresh per request from the binding the Worker
 * receives.
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
