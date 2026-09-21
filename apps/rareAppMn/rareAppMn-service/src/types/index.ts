import type { Database } from '../db';

export interface GraphQLContext {
  db: Database;
}
