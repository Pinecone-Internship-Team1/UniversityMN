import gql from 'graphql-tag';

export const userTypeDefs = gql`
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    imageUrl: String
    role: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Upserts a User by id (the Clerk user id). Used by the Clerk webhook to
  mirror user.created / user.updated events — not intended for direct
  end-user use.
  """
  input UpsertUserInput {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    imageUrl: String
    role: String
  }

  extend type Query {
    users: [User!]!
    user(id: ID!): User
  }

  extend type Mutation {
    upsertUser(input: UpsertUserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`;
