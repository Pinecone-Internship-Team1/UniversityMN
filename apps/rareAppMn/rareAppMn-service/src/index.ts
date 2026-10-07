import { createSchema, createYoga } from 'graphql-yoga';
import { createContext, type ContextExtensions, type WorkerServerContext } from './context';
import { createDb } from './db';
import { seedDatabase } from './db/seed';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { type Env, getAllowedOrigins, isDevelopment } from './lib/env';
import { handleClerkWebhook } from './webhooks/clerk';

export type { Env };

/**
 * Headers every frontend GraphQL client may need: `apollo-require-preflight`
 * is Apollo Client's CSRF-prevention header, `content-type`/`authorization`
 * cover Relay, urql, and plain fetch. Anything else a client's preflight
 * explicitly asks for is echoed back below too, so adding a new header on
 * the frontend never requires a backend change.
 */
const DEFAULT_ALLOWED_HEADERS = 'Content-Type, Authorization, apollo-require-preflight';

let yoga: ReturnType<typeof createYoga<WorkerServerContext, ContextExtensions>> | undefined;

function getYoga(env: Env) {
  yoga ??= createYoga<WorkerServerContext, ContextExtensions>({
    schema: createSchema<WorkerServerContext & ContextExtensions>({ typeDefs, resolvers }),
    context: createContext,
    graphqlEndpoint: '/graphql',
    landingPage: false,
    // GraphiQL is a nice-to-have for frontend teams exploring the schema in
    // development, but the playground + ease of ad-hoc introspection isn't
    // something we want reachable once ENVIRONMENT=production.
    graphiql: isDevelopment(env),
    // CORS is handled once, centrally, in `fetch()` below (so the same
    // policy applies to /graphql, /webhooks/clerk, and /health alike).
    // Yoga's own CORS plugin is disabled to avoid a second, divergent policy.
    cors: false,
  });
  return yoga;
}

function buildCorsHeaders(request: Request, env: Env): HeadersInit {
  const requestOrigin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];

  // Reflect whatever headers the browser's preflight actually asked for
  // (falling back to the baseline list) so a new frontend-added header never
  // needs a backend deploy to be unblocked.
  const requestedHeaders = request.headers.get('access-control-request-headers');
  const allowHeaders = requestedHeaders ?? DEFAULT_ALLOWED_HEADERS;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin, Access-Control-Request-Headers',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    let response: Response;

    if (url.pathname === '/webhooks/clerk' && request.method === 'POST') {
      response = await handleClerkWebhook(request, env, createDb(env.DB));
    } else if (url.pathname === '/health') {
      response = Response.json({ status: 'ok', environment: env.ENVIRONMENT ?? 'development' });
    } else if (url.pathname === '/dev/seed' && request.method === 'POST') {
      // Dev/demo convenience so pages never render empty locally. Never
      // reachable once ENVIRONMENT=production.
      if (!isDevelopment(env)) {
        response = new Response('Not found', { status: 404 });
      } else {
        const summary = await seedDatabase(createDb(env.DB));
        response = Response.json({ status: 'seeded', ...summary });
      }
    } else {
      response = await getYoga(env).fetch(request, { env, ctx });
    }

    const merged = new Response(response.body, response);
    for (const [key, value] of Object.entries(corsHeaders)) {
      merged.headers.set(key, value);
    }
    return merged;
  },
};
