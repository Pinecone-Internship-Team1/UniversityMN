import type { YogaInitialContext } from 'graphql-yoga';
import { createDb, type Database } from './db';
import type { AuthenticatedUser } from './lib/auth';
import { getAuthenticatedUser } from './lib/auth';
import type { Env } from './lib/env';
import { forbidden, unauthenticated } from './lib/validate';
import { createLoaders, type Loaders } from './loaders';

/** Extra bindings graphql-yoga receives from `src/index.ts`'s `yoga.fetch(request, { env, ctx })`. */
export interface WorkerServerContext {
  env: Env;
  ctx: ExecutionContext;
}

/** Everything the context factory adds on top of the server/initial context. */
export interface ContextExtensions {
  db: Database;
  loaders: Loaders;
  user: AuthenticatedUser | null;
}

export interface GraphQLContext
  extends YogaInitialContext,
    WorkerServerContext,
    ContextExtensions {}

export async function createContext(
  initialContext: YogaInitialContext & WorkerServerContext
): Promise<ContextExtensions> {
  const { request, env } = initialContext;
  const db = createDb(env.DB);
  const user = await getAuthenticatedUser(request, env);

  return { db, loaders: createLoaders(db), user };
}

export function requireUser(context: GraphQLContext): AuthenticatedUser {
  if (!context.user) throw unauthenticated();
  return context.user;
}

export function requireAdmin(context: GraphQLContext): AuthenticatedUser {
  const user = requireUser(context);
  if (user.role !== 'admin') throw forbidden('Admin privileges are required for this action.');
  return user;
}
