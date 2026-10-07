import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createGraphqlClient } from "./graphql-client";

/**
 * Creates a fresh urql client bound to the current request's Clerk session.
 *
 * Must be called per-request (e.g. once per Server Component render) rather
 * than cached at module scope: Next.js serves concurrent requests from
 * different users within the same server process, and `auth()` is only
 * valid for the request it's called within.
 */
export function createServerGraphqlClient() {
  return createGraphqlClient(async () => {
    const { getToken } = await auth();
    return getToken();
  });
}
