import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime

  enum UniversityType {
    PUBLIC
    PRIVATE
  }

  type University {
    id: ID!
    name: String!
    shortName: String
    logo: String
    description: String
    type: UniversityType!
    location: String
    address: String
    website: String
    phone: String
    email: String
    establishedYear: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateUniversityInput {
    name: String!
    shortName: String
    logo: String
    description: String
    type: UniversityType!
    location: String
    address: String
    website: String
    phone: String
    email: String
    establishedYear: Int
  }

  type Query {
    universities: [University!]!
    university(id: ID!): University
  }

  type Mutation {
    createUniversity(input: CreateUniversityInput!): University!
  }
`;
