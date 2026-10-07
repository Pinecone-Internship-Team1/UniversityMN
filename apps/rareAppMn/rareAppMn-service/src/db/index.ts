import { drizzle } from 'drizzle-orm/d1';
import * as dbSchema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema: dbSchema });
}

export type Database = ReturnType<typeof createDb>;

export * as schema from './schema';
