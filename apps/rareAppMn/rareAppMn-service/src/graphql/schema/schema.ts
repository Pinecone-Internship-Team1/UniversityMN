import gql from 'graphql-tag';

// Shared scalar declaration. Entity type files below declare `type Query`
// (university.ts) and extend it (`extend type Query`) with their own
// fields, so this file only needs to carry what's common to all of them.
export const schemaTypeDefs = gql`
  scalar DateTime
`;
