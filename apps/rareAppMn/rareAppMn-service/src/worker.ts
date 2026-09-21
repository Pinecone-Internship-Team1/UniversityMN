import { ApolloServer, HeaderMap } from '@apollo/server';

import { createDb } from './db';
import { resolvers } from './graphql/resolvers';
import { typeDefs } from './graphql/schema';
import type { GraphQLContext } from './types';

interface Env {
  DB: D1Database;
}

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  includeStacktraceInErrorResponses: false,
});
const serverStarted = server.start();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    await serverStarted;

    const url = new URL(request.url);
    const headers = new HeaderMap();
    for (const [key, value] of request.headers) {
      headers.set(key.toLowerCase(), value);
    }

    let body: unknown;
    if (request.method === 'POST') {
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ errors: [{ message: 'Invalid JSON body' }] }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }
    }

    const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: request.method,
        headers,
        search: url.search,
        body,
      },
      context: async () => ({ db: createDb(env.DB) }),
    });

    const responseHeaders = new Headers();
    for (const [key, value] of httpGraphQLResponse.headers) {
      responseHeaders.set(key, value);
    }
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }

    if (httpGraphQLResponse.body.kind === 'complete') {
      return new Response(httpGraphQLResponse.body.string, {
        status: httpGraphQLResponse.status ?? 200,
        headers: responseHeaders,
      });
    }

    let combined = '';
    for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
      combined += chunk;
    }
    return new Response(combined, {
      status: httpGraphQLResponse.status ?? 200,
      headers: responseHeaders,
    });
  },
};
