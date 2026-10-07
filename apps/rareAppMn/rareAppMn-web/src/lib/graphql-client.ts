import { authExchange } from "@urql/exchange-auth";
import {
  type Client,
  type CombinedError,
  cacheExchange,
  createClient,
  fetchExchange,
} from "@urql/core";

export const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:8787/graphql";

/**
 * Returns the current Clerk session JWT, or `null` when signed out.
 * Called fresh on every mutation/query and again whenever the backend
 * reports an auth error, so a short-lived token is always re-fetched
 * rather than cached indefinitely.
 */
export type GetTokenFn = () => Promise<string | null>;

function isUnauthenticatedError(error: CombinedError): boolean {
  return error.graphQLErrors.some(
    (graphQLError) => graphQLError.extensions?.["code"] === "UNAUTHENTICATED",
  );
}

/**
 * `getToken` can throw rather than reject-cleanly in contexts it doesn't
 * expect -- notably Clerk's client-side `useAuth().getToken` throws a
 * `clerk_runtime_not_browser` error if invoked while this client is
 * server-rendered (React Server Components render 'use client' components
 * on the server too, for the initial HTML). Since this client is never
 * actually used for data fetching during SSR in this app (Server Components
 * fetch via `graphql-server.ts` instead), treating a thrown/rejected
 * `getToken` as "anonymous" here is always safe, and keeps a single bad
 * call from permanently wedging urql's authExchange (which otherwise blocks
 * all further operations after an unhandled init rejection).
 */
async function getTokenSafely(getToken: GetTokenFn): Promise<string | null> {
  try {
    return await getToken();
  } catch {
    return null;
  }
}

/**
 * Creates a urql client pointed at the rareAppMn-service GraphQL API.
 *
 * Framework-agnostic by design: callers (a Server Component helper, or a
 * client-side Provider) supply `getToken`, which is where Clerk-specific
 * session access lives. This keeps the client usable identically from
 * React Server Components (via `.query()/.mutation()` directly) and from
 * `'use client'` components (via the `Provider` + `useQuery`/`useMutation`
 * hooks from `urql`).
 */
export function createGraphqlClient(getToken: GetTokenFn): Client {
  return createClient({
    url: GRAPHQL_ENDPOINT,
    exchanges: [
      cacheExchange,
      authExchange(async (utils) => {
        let token = await getTokenSafely(getToken);

        return {
          addAuthToOperation(operation) {
            if (!token) return operation;
            return utils.appendHeaders(operation, {
              Authorization: `Bearer ${token}`,
            });
          },
          willAuthError() {
            // Clerk's getToken() always hands back a currently-valid,
            // auto-refreshed token, so there's nothing to pre-emptively
            // check here -- didAuthError + refreshAuth below cover it.
            return false;
          },
          didAuthError(error) {
            return isUnauthenticatedError(error);
          },
          async refreshAuth() {
            token = await getTokenSafely(getToken);
          },
        };
      }),
      fetchExchange,
    ],
    fetchOptions: {
      headers: { "Content-Type": "application/json" },
    },
  });
}
