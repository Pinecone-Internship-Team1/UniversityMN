"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Provider as UrqlProvider } from "urql";
import { createGraphqlClient } from "@/lib/graphql-client";

export function GraphqlProvider({ children }: { children: ReactNode }) {
  const { getToken, userId: authUserId, isLoaded } = useAuth();
  // While Clerk loads, userId is undefined; treat that as signed out (null) so
  // the client made on first render isn't thrown away (with its cache and
  // in-flight queries) when Clerk finishes loading for a signed-out visitor.
  const userId = isLoaded ? (authUserId ?? null) : null;

  // Keep the latest `getToken` behind a ref so the client (and its cache)
  // is created exactly once per signed-in user, while every GraphQL operation
  // still calls the current Clerk session's token getter rather than a stale one.
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [userClient, setUserClient] = useState(() => ({
    userId,
    client: createGraphqlClient(() => getTokenRef.current()),
  }));

  if (userClient.userId !== userId) {
    setUserClient({
      userId,
      client: createGraphqlClient(() => getTokenRef.current()),
    });
  }

  return <UrqlProvider value={userClient.client}>{children}</UrqlProvider>;
}
