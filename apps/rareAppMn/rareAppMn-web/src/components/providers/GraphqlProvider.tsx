"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Provider as UrqlProvider } from "urql";
import { createGraphqlClient } from "@/lib/graphql-client";

export function GraphqlProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  // Keep the latest `getToken` behind a ref so the client (and its cache)
  // is created exactly once per mount, while every GraphQL operation still
  // calls the current Clerk session's token getter rather than a stale one.
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const client = useMemo(
    () => createGraphqlClient(() => getTokenRef.current()),
    [],
  );

  return <UrqlProvider value={client}>{children}</UrqlProvider>;
}
