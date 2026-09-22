import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { resolvers } from './graphql/resolvers';
import { typeDefs } from './graphql/schema';

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: Number(process.env['PORT'] ?? 4000) },
});

console.log(`University GraphQL API ready at ${url}`);
