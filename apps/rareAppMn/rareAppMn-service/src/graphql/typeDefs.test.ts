import { expect, test } from 'bun:test';
import { buildSchema } from 'graphql';
import { typeDefs } from './typeDefs';

// Typecheck and lint don't parse the SDL string, so a stray quote in a description only shows up at runtime.
test('the schema parses', () => {
  const major = buildSchema(typeDefs).getType('Major');
  expect(major).toBeDefined();
  expect(Object.keys((major as { getFields(): object }).getFields())).toContain('selectionType');
});
