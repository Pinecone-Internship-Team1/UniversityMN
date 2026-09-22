import { GraphQLScalarType, Kind } from 'graphql';
import { mutations } from './mutations';
import { queries } from './queries';

const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string',
  serialize(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new TypeError('DateTime can only serialize strings or Date objects');
  },
  parseValue(value) {
    if (typeof value !== 'string') throw new TypeError('DateTime must be an ISO-8601 string');
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) throw new TypeError('DateTime must be an ISO-8601 string');
    return ast.value;
  },
});

export const resolvers = {
  DateTime,
  Query: queries,
  Mutation: mutations,
};
