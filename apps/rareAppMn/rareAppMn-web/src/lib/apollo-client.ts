import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/";

export function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_URL }),
    cache: new InMemoryCache(),
  });
}
