import { NoSchemaIntrospectionCustomRule, type ValidationRule } from 'graphql';
import { createSchema, createYoga, type Plugin } from 'graphql-yoga';
import { createContext, type ContextExtensions, type WorkerServerContext } from './context';
import { createDb } from './db';
import { seedDatabase } from './db/seed';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { createMaxAliasesRule, createMaxDepthRule } from './graphql/validationRules';
import { type Env, getAllowedOrigins, isDevelopment, isLocalDevelopment } from './lib/env';
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
const MAX_REQUEST_BODY_BYTES = 1_000_000;
const MAX_QUERY_DEPTH = 8;
const MAX_QUERY_ALIASES = 30;

function validationRulesPlugin(env: Env): Plugin {
  const rules: ValidationRule[] = [
    createMaxDepthRule(MAX_QUERY_DEPTH),
    createMaxAliasesRule(MAX_QUERY_ALIASES),
  ];
  if (!isDevelopment(env)) rules.push(NoSchemaIntrospectionCustomRule);
  return {
    onValidate({ addValidationRule }) {
      for (const rule of rules) addValidationRule(rule);
    },
  };
}

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
    plugins: [validationRulesPlugin(env)],
  });
  return yoga;
}

function buildCorsHeaders(request: Request, env: Env): Record<string, string> {
  const varyHeaders = { Vary: 'Origin, Access-Control-Request-Headers' };
  const requestOrigin = request.headers.get('origin');
  if (!requestOrigin || !getAllowedOrigins(env).includes(requestOrigin)) return varyHeaders;

  // Reflect whatever headers the browser's preflight actually asked for
  // (falling back to the baseline list) so a new frontend-added header never
  // needs a backend deploy to be unblocked.
  const requestedHeaders = request.headers.get('access-control-request-headers');
  const allowHeaders = requestedHeaders ?? DEFAULT_ALLOWED_HEADERS;

  return {
    ...varyHeaders,
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Max-Age': '86400',
  };
}

async function readBodyWithinLimit(request: Request): Promise<Uint8Array<ArrayBuffer> | null> {
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_BODY_BYTES) return null;
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function withBodyLimit(request: Request): Promise<Request | null> {
  if (request.method !== 'POST') return request;
  const body = await readBodyWithinLimit(request);
  return body ? new Request(request, { body }) : null;
}

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/health') {
    return Response.json({ status: 'ok', environment: env.ENVIRONMENT ?? 'development' });
  }

  if (url.pathname === '/dev/seed' && request.method === 'POST') {
    // Dev/demo convenience so pages never render empty locally. Never
    // reachable once ENVIRONMENT=production.
    if (!isLocalDevelopment(env, request)) return new Response('Not found', { status: 404 });
    const summary = await seedDatabase(createDb(env.DB));
    return Response.json({ status: 'seeded', ...summary });
  }

  const limitedRequest = await withBodyLimit(request);
  if (!limitedRequest) {
    return Response.json({ errors: [{ message: 'Request body is too large.' }] }, { status: 413 });
  }

  if (url.pathname === '/webhooks/clerk' && request.method === 'POST') {
    return handleClerkWebhook(limitedRequest, env, createDb(env.DB));
  }

  return getYoga(env).fetch(limitedRequest, { env, ctx });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    let response: Response;
    try {
      response = await route(request, env, ctx);
    } catch (error) {
      console.error('Unhandled error while processing request.', error);
      response = Response.json({ errors: [{ message: 'Internal server error.' }] }, { status: 500 });
    }

    const merged = new Response(response.body, response);
    for (const [key, value] of Object.entries(corsHeaders)) {
      merged.headers.set(key, value);
    }
    return merged;
  },
};
